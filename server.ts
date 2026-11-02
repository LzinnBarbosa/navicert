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

// Força o Node.js a priorizar conexões IPv4 para evitar ENETUNREACH no Render
dns.setDefaultResultOrder('ipv4first');

dotenv.config();

const { Pool } = pkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const portArgIndex = process.argv.indexOf('--port');
const port = portArgIndex !== -1 ? parseInt(process.argv[portArgIndex + 1], 10) : 3000;

// --- 1. MIDDLEWARES DE SEGURANÇA ---

// Cabeçalhos HTTP seguros (Helmet)
app.use(helmet({
  contentSecurityPolicy: false // Desativado para permitir assets estáticos da build do Vite
}));

// Proteção de Origem (CORS)
app.use(cors());

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

    // 2. Tabela de Certificados (NORMAM-202)
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
        arquivo_anexo_url TEXT,
        observacoes TEXT,
        criado_em TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Garantia de Colunas
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

    const colunasCert = [
      ['categoria', "TEXT DEFAULT 'CERTIFICADO'"],
      ['tipo_teste', 'TEXT'],
      ['responsavel_tecnico', 'TEXT'],
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

    const { rows } = await pool.query(
      `INSERT INTO certificados (
        embarcacao_id, categoria, tipo, tipo_teste, numero, data_emissao, data_vencimento, status, 
        orgao_emissor, responsavel_tecnico, tipo_vistoria, numero_art, fabricante_equipamento, 
        modelo_equipamento, numero_serie_equipamento, faixa_medicao, tracao_estatica_ton, marca_agulha, 
        serie_agulha, local_compensacao, pressao_trabalho, pressao_teste, lacre_tag, tanque_vinculado, 
        continuidade_eletrica, laboratorio_calibracao, arquivo_anexo_url, observacoes
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, 
        $19, $20, $21, $22, $23, $24, $25, $26, $27, $28
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
        c.arquivo_anexo_url || null,
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
        arquivo_anexo_url = $27,
        observacoes = $28
      WHERE id = $29`,
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
        c.arquivo_anexo_url || null,
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

// --- 7. CONSULTOR REGULATÓRIO IA (GEMINI) ---

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
      model: 'gemini-3.8-flash',
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

// --- 8. INICIALIZAÇÃO DO SERVIDOR ---

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: process.env.DISABLE_HMR !== 'true' },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`NavCert server rodando na porta ${port} (${isProd ? 'produção' : 'desenvolvimento'})`);
  });
}

startServer();