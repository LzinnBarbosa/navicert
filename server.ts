import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import pkg from 'pg';
import dns from 'dns';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import cron from 'node-cron';
import { Resend } from 'resend';

// Força o Node.js a priorizar conexões IPv4 para evitar ENETUNREACH no Render
dns.setDefaultResultOrder('ipv4first');

dotenv.config();

const { Pool } = pkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Leitura correta da porta: respeita a flag --port, a variável PORT do Render ou o padrão 3000
const portArgIndex = process.argv.indexOf('--port');
const port = portArgIndex !== -1 
  ? parseInt(process.argv[portArgIndex + 1], 10) 
  : (process.env.PORT ? parseInt(process.env.PORT, 10) : 3000);

// Configuração do Cliente Resend para Envio de E-mails Regulatórios
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// --- 1. MIDDLEWARES DE SEGURANÇA E CORS ---

// Cabeçalhos HTTP seguros (Helmet)
app.use(helmet({
  contentSecurityPolicy: false // Desativado para permitir assets estáticos da build do Vite
}));

// Proteção de Origem (CORS) Flexível para Dev e Produção no Render
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:3001',
  'https://navicert.onrender.com',
  process.env.FRONTEND_URL || ''
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      callback(new Error('Acesso bloqueado pela política de CORS do NavCert.'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Limitador de requisições por IP (Rate Limiter: máx 100 req por 15 minutos)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Limite de requisições excedido. Tente novamente mais tarde.' }
});

app.use('/api/', apiLimiter);
app.use(express.json({ limit: '10mb' }));

// --- 2. SCHEMAS DE VALIDAÇÃO ZOD ---

const embarcacaoSchema = z.object({
  nome: z.string().trim().min(1, 'Nome é obrigatório e não pode ser vazio.'),
  inscricao: z.string().trim().min(1, 'Inscrição é obrigatória e não pode ser vazia.'),
  tipo: z.string().trim().min(1, 'Tipo é obrigatório e não pode ser vazio.'),
  situacao: z.string().optional().default('Ativa'),
  proprietario: z.string().nullable().optional(),
  construtor: z.string().nullable().optional(),
  ano_construcao: z.number().int().positive().nullable().optional(),
  trecho: z.string().nullable().optional(),
  porto_inscricao: z.string().nullable().optional(),
  arqueacao_bruta: z.number().positive().nullable().optional(),
});

const certificadoSchema = z.object({
  embarcacao_id: z.number().int().optional(),
  vessel_id: z.number().int().optional(),
  categoria: z.string().optional().default('CERTIFICADO'),
  tipo: z.string().trim().min(1, 'Tipo de certificado é obrigatório.'),
  tipo_teste: z.string().nullable().optional(),
  numero: z.string().nullable().optional(),
  data_emissao: z.string().nullable().optional(),
  data_validade: z.string().optional(),
  data_vencimento: z.string().optional(),
  status: z.string().optional().default('valido'),
  orgao_emissor: z.string().nullable().optional(),
  responsavel_tecnico: z.string().nullable().optional(),
  tipo_vistoria: z.string().nullable().optional(),
  numero_art: z.string().nullable().optional(),
  fabricante_equipamento: z.string().nullable().optional(),
  modelo_equipamento: z.string().nullable().optional(),
  numero_serie_equipamento: z.string().nullable().optional(),
  faixa_medicao: z.string().nullable().optional(),
  tracao_estatica_ton: z.string().nullable().optional(),
  marca_agulha: z.string().nullable().optional(),
  serie_agulha: z.string().nullable().optional(),
  local_compensacao: z.string().nullable().optional(),
  pressao_trabalho: z.string().nullable().optional(),
  pressao_teste: z.string().nullable().optional(),
  lacre_tag: z.string().nullable().optional(),
  tanque_vinculado: z.string().nullable().optional(),
  continuidade_eletrica: z.string().nullable().optional(),
  laboratorio_calibracao: z.string().nullable().optional(),
  url_documento: z.string().nullable().optional(),
  arquivo_path: z.string().nullable().optional(),
  arquivo_anexo_url: z.string().nullable().optional(),
  observacoes: z.string().nullable().optional()
});

// --- 3. TRATAMENTO SEGURO DE ERROS (OWASP HARDENING) ---

function responderErro(res: express.Response, error: any, mensagemPublica: string, statusCode = 500) {
  console.error(`❌ [ERRO SERVIDOR]: ${mensagemPublica}`, error);
  return res.status(statusCode).json({
    error: mensagemPublica,
    ...(process.env.NODE_ENV !== 'production' && { detalheTecnico: error?.message })
  });
}

// --- 4. CONEXÃO COM O BANCO DE DADOS POSTGRESQL (SUPABASE) ---

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function inicializarBancoPostgres() {
  try {
    // 1. Tabela de Embarcações
    await pool.query(`
      CREATE TABLE IF NOT EXISTS embarcacoes (
        id SERIAL PRIMARY KEY,
        nome TEXT NOT NULL,
        inscricao TEXT NOT NULL UNIQUE,
        tipo TEXT NOT NULL,
        situacao TEXT DEFAULT 'Ativa',
        proprietario TEXT,
        construtor TEXT,
        ano_construcao INTEGER,
        trecho TEXT,
        porto_inscricao TEXT,
        arqueacao_bruta DOUBLE PRECISION,
        criado_em TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Tabela de Certificados (NORMAM-202) com suporte a Supabase Storage
    await pool.query(`
      CREATE TABLE IF NOT EXISTS certificados (
        id SERIAL PRIMARY KEY,
        embarcacao_id INTEGER NOT NULL REFERENCES embarcacoes(id) ON DELETE CASCADE,
        categoria TEXT DEFAULT 'CERTIFICADO',
        tipo TEXT NOT NULL,
        tipo_teste TEXT,
        numero TEXT,
        data_emissao TEXT,
        data_vencimento TEXT NOT NULL,
        status TEXT DEFAULT 'valido',
        orgao_emissor TEXT,
        responsavel_tecnico TEXT,
        tipo_vistoria TEXT,
        numero_art TEXT,
        fabricante_equipamento TEXT,
        modelo_equipamento TEXT,
        numero_serie_equipamento TEXT,
        faixa_medicao TEXT,
        tracao_estatica_ton TEXT,
        marca_agulha TEXT,
        serie_agulha TEXT,
        local_compensacao TEXT,
        pressao_trabalho TEXT,
        pressao_teste TEXT,
        lacre_tag TEXT,
        tanque_vinculado TEXT,
        continuidade_eletrica TEXT,
        laboratorio_calibracao TEXT,
        url_documento TEXT,
        arquivo_path TEXT,
        arquivo_anexo_url TEXT,
        observacoes TEXT,
        criado_em TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Garantia de Colunas para Embarcações
    const colunasEmb = [
      ['situacao', "TEXT DEFAULT 'Ativa'"],
      ['proprietario', 'TEXT'],
      ['construtor', 'TEXT'],
      ['ano_construcao', 'INTEGER'],
      ['trecho', 'TEXT'],
      ['porto_inscricao', 'TEXT'],
      ['arqueacao_bruta', 'DOUBLE PRECISION']
    ];

    for (const [col, def] of colunasEmb) {
      await pool.query(`ALTER TABLE embarcacoes ADD COLUMN IF NOT EXISTS ${col} ${def};`);
    }

    // Garantia de Colunas para Certificados (incluindo anexos do Storage)
    const colunasCert = [
      ['categoria', "TEXT DEFAULT 'CERTIFICADO'"],
      ['tipo_teste', 'TEXT'],
      ['responsavel_tecnico', 'TEXT'],
      ['url_documento', 'TEXT'],
      ['arquivo_path', 'TEXT'],
      ['arquivo_anexo_url', 'TEXT'],
      ['numero', 'TEXT'],
      ['data_emissao', 'TEXT'],
      ['orgao_emissor', 'TEXT'],
      ['tipo_vistoria', 'TEXT'],
      ['observacoes', 'TEXT'],
      ['numero_art', 'TEXT'],
      ['fabricante_equipamento', 'TEXT'],
      ['modelo_equipamento', 'TEXT'],
      ['numero_serie_equipamento', 'TEXT'],
      ['faixa_medicao', 'TEXT'],
      ['tracao_estatica_ton', 'TEXT'],
      ['marca_agulha', 'TEXT'],
      ['serie_agulha', 'TEXT'],
      ['local_compensacao', 'TEXT'],
      ['pressao_trabalho', 'TEXT'],
      ['pressao_teste', 'TEXT'],
      ['lacre_tag', 'TEXT'],
      ['tanque_vinculado', 'TEXT'],
      ['continuidade_eletrica', 'TEXT'],
      ['laboratorio_calibracao', 'TEXT']
    ];

    for (const [col, def] of colunasCert) {
      await pool.query(`ALTER TABLE certificados ADD COLUMN IF NOT EXISTS ${col} ${def};`);
    }

    console.log('✅ Banco de dados PostgreSQL (Supabase) conectado e tabelas sincronizadas!');
  } catch (err) {
    console.error('❌ Erro na inicialização do banco PostgreSQL:', err);
  }
}
inicializarBancoPostgres();

// Health check endpoint
app.get('/api/health', async (_req, res) => {
  try {
    const { rows } = await pool.query('SELECT NOW()');
    res.json({ status: 'ok', database: 'PostgreSQL Supabase conectado', time: rows[0].now });
  } catch (error: any) {
    responderErro(res, error, 'Erro na conexão com o banco de dados.');
  }
});

// --- 5. ROTAS DE EMBARCAÇÕES ---

app.get('/api/embarcacoes', async (_req, res) => {
  try {
    const { rows: embarcacoes } = await pool.query('SELECT * FROM embarcacoes ORDER BY nome ASC');
    const resultado = await Promise.all(
      embarcacoes.map(async (emb: any) => {
        const { rows: certificados } = await pool.query(
          'SELECT * FROM certificados WHERE embarcacao_id = $1 ORDER BY id ASC',
          [emb.id]
        );
        return { ...emb, certificados };
      })
    );
    return res.json(resultado);
  } catch (error: any) {
    return responderErro(res, error, 'Erro ao buscar embarcações.');
  }
});

app.post('/api/embarcacoes', async (req, res) => {
  try {
    const validacao = embarcacaoSchema.safeParse(req.body);
    if (!validacao.success) {
      return res.status(400).json({
        error: 'Dados inválidos.',
        detalhes: validacao.error.issues.map(i => i.message)
      });
    }

    const {
      nome,
      inscricao,
      tipo,
      situacao,
      proprietario,
      construtor,
      ano_construcao,
      trecho,
      porto_inscricao,
      arqueacao_bruta
    } = validacao.data;

    const { rows } = await pool.query(
      `INSERT INTO embarcacoes (
        nome, inscricao, tipo, situacao, proprietario, construtor, ano_construcao, trecho, porto_inscricao, arqueacao_bruta
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
      [
        nome,
        inscricao,
        tipo,
        situacao,
        proprietario || null,
        construtor || null,
        ano_construcao || null,
        trecho || null,
        porto_inscricao || null,
        arqueacao_bruta || null
      ]
    );

    return res.status(201).json({
      id: rows[0].id,
      ...validacao.data,
      certificados: []
    });
  } catch (error: any) {
    return responderErro(res, error, 'Erro ao cadastrar embarcação.');
  }
});

app.put('/api/embarcacoes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const validacao = embarcacaoSchema.safeParse(req.body);
    if (!validacao.success) {
      return res.status(400).json({
        error: 'Dados inválidos.',
        detalhes: validacao.error.issues.map(i => i.message)
      });
    }

    const {
      nome,
      inscricao,
      tipo,
      situacao,
      proprietario,
      construtor,
      ano_construcao,
      trecho,
      porto_inscricao,
      arqueacao_bruta
    } = validacao.data;

    const result = await pool.query(
      `UPDATE embarcacoes SET
        nome = $1,
        inscricao = $2,
        tipo = $3,
        situacao = $4,
        proprietario = $5,
        construtor = $6,
        ano_construcao = $7,
        trecho = $8,
        porto_inscricao = $9,
        arqueacao_bruta = $10
      WHERE id = $11`,
      [
        nome,
        inscricao,
        tipo,
        situacao,
        proprietario || null,
        construtor || null,
        ano_construcao || null,
        trecho || null,
        porto_inscricao || null,
        arqueacao_bruta || null,
        id
      ]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Embarcação não encontrada.' });
    }

    return res.json({ id, ...validacao.data });
  } catch (error: any) {
    return responderErro(res, error, 'Erro ao atualizar embarcação.');
  }
});

app.delete('/api/embarcacoes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM embarcacoes WHERE id = $1', [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Embarcação não encontrada.' });
    }

    return res.json({ success: true, message: 'Embarcação removida com sucesso.' });
  } catch (error: any) {
    return responderErro(res, error, 'Erro ao remover embarcação.');
  }
});

// --- 6. ROTAS DE CERTIFICADOS ---

app.post('/api/certificados', async (req, res) => {
  try {
    const validacao = certificadoSchema.safeParse(req.body);
    if (!validacao.success) {
      return res.status(400).json({
        error: 'Dados inválidos para o certificado.',
        detalhes: validacao.error.issues.map(i => i.message)
      });
    }

    const c = validacao.data;
    const embId = c.embarcacao_id || c.vessel_id;
    const vencimento = c.data_vencimento || c.data_validade;

    if (!embId || !vencimento) {
      return res.status(400).json({ error: 'Embarcação e data de vencimento são obrigatórias.' });
    }

    const urlDoc = c.url_documento || c.arquivo_anexo_url || null;

    const { rows } = await pool.query(
      `INSERT INTO certificados (
        embarcacao_id, categoria, tipo, tipo_teste, numero, data_emissao, data_vencimento, status, 
        orgao_emissor, responsavel_tecnico, tipo_vistoria, numero_art, fabricante_equipamento, 
        modelo_equipamento, numero_serie_equipamento, faixa_medicao, tracao_estatica_ton, marca_agulha, 
        serie_agulha, local_compensacao, pressao_trabalho, pressao_teste, lacre_tag, tanque_vinculado, 
        continuidade_eletrica, laboratorio_calibracao, url_documento, arquivo_path, arquivo_anexo_url, observacoes
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, 
        $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30
      ) RETURNING id`,
      [
        embId,
        c.categoria,
        c.tipo,
        c.tipo_teste || null,
        c.numero || null,
        c.data_emissao || null,
        vencimento,
        c.status,
        c.orgao_emissor || null,
        c.responsavel_tecnico || null,
        c.tipo_vistoria || null,
        c.numero_art || null,
        c.fabricante_equipamento || null,
        c.modelo_equipamento || null,
        c.numero_serie_equipamento || null,
        c.faixa_medicao || null,
        c.tracao_estatica_ton || null,
        c.marca_agulha || null,
        c.serie_agulha || null,
        c.local_compensacao || null,
        c.pressao_trabalho || null,
        c.pressao_teste || null,
        c.lacre_tag || null,
        c.tanque_vinculado || null,
        c.continuidade_eletrica || null,
        c.laboratorio_calibracao || null,
        urlDoc,
        c.arquivo_path || null,
        urlDoc,
        c.observacoes || null
      ]
    );

    return res.status(201).json({
      id: rows[0].id,
      embarcacao_id: embId,
      vessel_id: embId,
      categoria: c.categoria,
      tipo: c.tipo,
      ...req.body
    });
  } catch (error: any) {
    return responderErro(res, error, 'Erro ao cadastrar certificado.');
  }
});

app.put('/api/certificados/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const validacao = certificadoSchema.safeParse(req.body);
    if (!validacao.success) {
      return res.status(400).json({
        error: 'Dados inválidos.',
        detalhes: validacao.error.issues.map(i => i.message)
      });
    }

    const c = validacao.data;
    const embId = c.embarcacao_id || c.vessel_id;
    const vencimento = c.data_vencimento || c.data_validade;
    const urlDoc = c.url_documento || c.arquivo_anexo_url || null;

    const result = await pool.query(
      `UPDATE certificados SET
        embarcacao_id = $1,
        categoria = $2,
        tipo = $3,
        tipo_teste = $4,
        numero = $5,
        data_emissao = $6,
        data_vencimento = $7,
        status = $8,
        orgao_emissor = $9,
        responsavel_tecnico = $10,
        tipo_vistoria = $11,
        numero_art = $12,
        fabricante_equipamento = $13,
        modelo_equipamento = $14,
        numero_serie_equipamento = $15,
        faixa_medicao = $16,
        tracao_estatica_ton = $17,
        marca_agulha = $18,
        serie_agulha = $19,
        local_compensacao = $20,
        pressao_trabalho = $21,
        pressao_teste = $22,
        lacre_tag = $23,
        tanque_vinculado = $24,
        continuidade_eletrica = $25,
        laboratorio_calibracao = $26,
        url_documento = $27,
        arquivo_path = $28,
        arquivo_anexo_url = $29,
        observacoes = $30
      WHERE id = $31`,
      [
        embId,
        c.categoria,
        c.tipo,
        c.tipo_teste || null,
        c.numero || null,
        c.data_emissao || null,
        vencimento,
        c.status,
        c.orgao_emissor || null,
        c.responsavel_tecnico || null,
        c.tipo_vistoria || null,
        c.numero_art || null,
        c.fabricante_equipamento || null,
        c.modelo_equipamento || null,
        c.numero_serie_equipamento || null,
        c.faixa_medicao || null,
        c.tracao_estatica_ton || null,
        c.marca_agulha || null,
        c.serie_agulha || null,
        c.local_compensacao || null,
        c.pressao_trabalho || null,
        c.pressao_teste || null,
        c.lacre_tag || null,
        c.tanque_vinculado || null,
        c.continuidade_eletrica || null,
        c.laboratorio_calibracao || null,
        urlDoc,
        c.arquivo_path || null,
        urlDoc,
        c.observacoes || null,
        id
      ]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Certificado não encontrado.' });
    }

    return res.json({ id, ...req.body });
  } catch (error: any) {
    return responderErro(res, error, 'Erro ao atualizar certificado.');
  }
});

app.delete('/api/certificados/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM certificados WHERE id = $1', [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Certificado não encontrado.' });
    }

    return res.json({ success: true, message: 'Certificado removido com sucesso.' });
  } catch (error: any) {
    return responderErro(res, error, 'Erro ao remover certificado.');
  }
});

// --- 7. SERVIÇO DE ALERTAS POR E-MAIL (RESEND + CRON) ---

async function executarVerificacaoAlertasEmail() {
  try {
    const { rows: certs } = await pool.query(`
      SELECT c.*, e.nome as embarcacao_nome, e.inscricao as embarcacao_inscricao
      FROM certificados c
      JOIN embarcacoes e ON e.id = c.embarcacao_id
      ORDER BY c.data_vencimento ASC
    `);

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const vencidos: any[] = [];
    const criticos: any[] = []; // <= 30 dias
    const atencao: any[] = [];  // <= 60 dias

    certs.forEach((c: any) => {
      const dataVenc = new Date(c.data_vencimento);
      dataVenc.setHours(0, 0, 0, 0);
      const diffDias = Math.ceil((dataVenc.getTime() - hoje.getTime()) / (1000 * 3600 * 24));

      if (diffDias < 0) {
        vencidos.push({ ...c, diffDias: Math.abs(diffDias) });
      } else if (diffDias <= 30) {
        criticos.push({ ...c, diffDias });
      } else if (diffDias <= 60) {
        atencao.push({ ...c, diffDias });
      }
    });

    console.log(`[Alertas NavCert] Vencidos: ${vencidos.length} | Críticos (<=30d): ${criticos.length} | Atenção (<=60d): ${atencao.length}`);

    if (vencidos.length === 0 && criticos.length === 0 && atencao.length === 0) {
      return { status: 'Conformidade total', totalAlertas: 0 };
    }

    if (!resend) {
      console.warn('⚠️ API Key do Resend (RESEND_API_KEY) não configurada no .env. Notificações por e-mail ignoradas.');
      return { status: 'Resend não configurado', totalAlertas: vencidos.length + criticos.length + atencao.length };
    }

    const destinatario = process.env.NOTIFICATION_EMAIL || 'gestao@navcert.com.br';

    const htmlBody = `
      <div style="font-family: Helvetica, Arial, sans-serif; color: #0f172a; max-width: 650px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
        <div style="background-color: #0b1726; padding: 24px; text-align: center;">
          <h1 style="color: #fbbf24; margin: 0; font-size: 20px; font-weight: 800; letter-spacing: 0.5px;">NavCert · Alerta de Conformidade Naval</h1>
          <p style="color: #38bdf8; margin: 6px 0 0 0; font-size: 13px;">Relatório Diário Automatizado de Vencimentos NORMAM-202</p>
        </div>

        <div style="padding: 24px; background-color: #ffffff;">
          <p style="font-size: 14px; color: #334155; margin-top: 0;">Prezada equipe técnica,</p>
          <p style="font-size: 13px; color: #475569;">Foram identificadas pendências operacionais nos documentos da frota:</p>

          ${vencidos.length > 0 ? `
            <div style="margin-top: 16px; padding: 12px 16px; background-color: #fef2f2; border-left: 4px solid #ef4444; border-radius: 4px;">
              <h3 style="margin: 0 0 8px 0; color: #991b1b; font-size: 14px;">🚨 CERTIFICADOS VENCIDOS (${vencidos.length})</h3>
              <ul style="margin: 0; padding-left: 18px; font-size: 12px; color: #7f1d1d; line-height: 1.6;">
                ${vencidos.map(v => `<li><strong>${v.embarcacao_nome}</strong> (${v.tipo}): Nº ${v.numero || 'S/N'} - Vencido há ${v.diffDias} dias</li>`).join('')}
              </ul>
            </div>
          ` : ''}

          ${criticos.length > 0 ? `
            <div style="margin-top: 16px; padding: 12px 16px; background-color: #fff7ed; border-left: 4px solid #f97316; border-radius: 4px;">
              <h3 style="margin: 0 0 8px 0; color: #9a3412; font-size: 14px;">⚠️ NÍVEL CRÍTICO (Vence em até 30 dias) (${criticos.length})</h3>
              <ul style="margin: 0; padding-left: 18px; font-size: 12px; color: #7c2d12; line-height: 1.6;">
                ${criticos.map(c => `<li><strong>${c.embarcacao_nome}</strong> (${c.tipo}): Nº ${c.numero || 'S/N'} - Restam ${c.diffDias} dias</li>`).join('')}
              </ul>
            </div>
          ` : ''}

          ${atencao.length > 0 ? `
            <div style="margin-top: 16px; padding: 12px 16px; background-color: #fefce8; border-left: 4px solid #eab308; border-radius: 4px;">
              <h3 style="margin: 0 0 8px 0; color: #854d0e; font-size: 14px;">⚡ NÍVEL DE ATENÇÃO (Vence em até 60 dias) (${atencao.length})</h3>
              <ul style="margin: 0; padding-left: 18px; font-size: 12px; color: #713f12; line-height: 1.6;">
                ${atencao.map(a => `<li><strong>${a.embarcacao_nome}</strong> (${a.tipo}): Nº ${a.numero || 'S/N'} - Restam ${a.diffDias} dias</li>`).join('')}
              </ul>
            </div>
          ` : ''}

          <div style="margin-top: 28px; padding: 16px; background-color: #f8fafc; border-radius: 8px; font-size: 12px; text-align: center; color: #64748b; border: 1px dashed #cbd5e1;">
            Acesse o sistema <a href="${process.env.FRONTEND_URL || 'https://navicert.onrender.com'}" style="color: #0284c7; text-decoration: none; font-weight: bold;">NavCert SaaS</a> para visualizar os laudos em PDF e atualizar o cadastro.
          </div>
        </div>
      </div>
    `;

    await resend.emails.send({
      from: 'NavCert Alertas <onboarding@resend.dev>',
      to: [destinatario],
      subject: `[NavCert] Alerta de Vencimento de Certificados (${vencidos.length} Vencidos / ${criticos.length} Críticos)`,
      html: htmlBody
    });

    console.log(`✅ E-mail de resumo enviado com sucesso para ${destinatario}`);
    return { status: 'Sucesso', destinatario, totalAlertas: vencidos.length + criticos.length + atencao.length };
  } catch (err: any) {
    console.error('❌ Erro na rotina de alertas por e-mail:', err);
    throw err;
  }
}

// Rota para Disparo Manual de Alertas por E-mail
app.post('/api/notificacoes/verificar-alertas', async (_req, res) => {
  try {
    const resultado = await executarVerificacaoAlertasEmail();
    return res.json({ success: true, resultado });
  } catch (error: any) {
    return responderErro(res, error, 'Falha ao acionar verificação de e-mails.');
  }
});

// Cron Job: Verificação automática diária às 07:00 da manhã
cron.schedule('0 7 * * *', async () => {
  console.log('⏰ Executando rotina diária agendada de auditoria e envio de alertas...');
  await executarVerificacaoAlertasEmail();
});

// --- 8. CONSULTOR REGULATÓRIO IA (GEMINI) ---

app.post('/api/orientacao', async (req, res) => {
  try {
    const { pergunta, vesselContext } = req.body;

    if (!pergunta || typeof pergunta !== 'string' || !pergunta.trim()) {
      return res.status(400).json({ error: 'Pergunta inválida ou vazia.' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(200).json({
        orientacao: `[Modo Consultor Local]\n\nPara a sua dúvida: "${pergunta}"\n\nRecomendações técnicas operacionais:\nVerifique a janela regulatória de vistoria (NORMAM 202).\nCertificados CSN e Borda Livre: Protocolo formal de 30 dias de antecedência.\nVistorias de Casco e Máquinas: Exigem ART/RRT de Responsável Técnico Naval.`
      });
    }

    const ai = new GoogleGenAI();
    const systemPrompt = `Você é o Consultor Técnico Especialista em Segurança da Navegação do NavCert, especialista em normas marítimas, regulamentações navais e gestão de conformidade de embarcações e frotas.`;
    const userPrompt = `Contexto da Frota e Certificados Cadastrados:\n${vesselContext || 'Nenhuma embarcação cadastrada no momento.'}\n\nDúvida / Solicitação do Usuário:\n${pergunta}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        { role: 'user', parts: [{ text: `${systemPrompt}\n\n---\n${userPrompt}` }] }
      ],
      config: {
        temperature: 0.3,
      }
    });

    const reply = response.text || 'Não foi possível gerar a resposta técnica no momento.';
    return res.json({ orientacao: reply });
  } catch (error: any) {
    return responderErro(res, error, 'Falha ao processar a consulta marítima.');
  }
});

// --- 9. INICIALIZAÇÃO DO SERVIDOR E ARQUIVOS ESTÁTICOS ---

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';
  const distPath = path.resolve(process.cwd(), 'dist');

  if (!isProd) {
    try {
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: { middlewareMode: true, hmr: process.env.DISABLE_HMR !== 'true' },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } catch (e) {
      console.log('⚠️ Erro ao iniciar middleware do Vite. Alternando para servir a pasta dist estática.');
      app.use(express.static(distPath));
      app.get('*', (_req, res) => {
        res.sendFile(path.resolve(distPath, 'index.html'));
      });
    }
  } else {
    // Servir aplicação estática compilada (Single Page Application - React/Vite)
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`NavCert server rodando na porta ${port} (${isProd ? 'produção' : 'desenvolvimento'})`);
  });
}

startServer();