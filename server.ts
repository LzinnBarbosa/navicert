import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import pkg from 'pg';
import dns from 'dns';

// Força o Node.js a priorizar conexões IPv4 para evitar ENETUNREACH no Render
dns.setDefaultResultOrder('ipv4first');

dotenv.config();

const { Pool } = pkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const portArgIndex = process.argv.indexOf('--port');
const port = portArgIndex !== -1 ? parseInt(process.argv[portArgIndex + 1], 10) : 3000;

app.use(express.json({ limit: '10mb' }));

// --- CONEXÃO COM O BANCO DE DADOS POSTGRESQL (SUPABASE) ---
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Criação e migração automática do esquema no PostgreSQL
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

    // 2. Tabela de Certificados (Conforme NORMAM-202)
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

    // Garantia de Colunas (Adiciona novas colunas caso a tabela já existisse no Postgres)
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
    res.status(500).json({ status: 'error', message: 'Erro na conexão com o banco de dados.' });
  }
});

// --- ROTAS DO BANCO DE DADOS (EMBARCAÇÕES E CERTIFICADOS) ---

// Listar todas as embarcações com seus certificados vinculados
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
    return res.status(500).json({ error: 'Erro ao buscar embarcações: ' + error.message });
  }
});

// Cadastrar nova embarcação
app.post('/api/embarcacoes', async (req, res) => {
  try {
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
    } = req.body;

    if (!nome || !inscricao || !tipo) {
      return res.status(400).json({ error: 'Campos nome, inscrição e tipo são obrigatórios.' });
    }

    const { rows } = await pool.query(
      `INSERT INTO embarcacoes (
        nome, inscricao, tipo, situacao, proprietario, construtor, ano_construcao, trecho, porto_inscricao, arqueacao_bruta
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
      [
        nome, 
        inscricao, 
        tipo, 
        situacao || 'Ativa', 
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
      ...req.body, 
      certificados: [] 
    });
  } catch (error: any) {
    return res.status(500).json({ error: 'Erro ao cadastrar embarcação: ' + error.message });
  }
});

// Atualizar dados de uma embarcação existente
app.put('/api/embarcacoes/:id', async (req, res) => {
  try {
    const { id } = req.params;
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
    } = req.body;

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
        proprietario, 
        construtor, 
        ano_construcao, 
        trecho, 
        porto_inscricao, 
        arqueacao_bruta, 
        id
      ]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Embarcação não encontrada.' });
    }

    return res.json({ id, ...req.body });
  } catch (error: any) {
    return res.status(500).json({ error: 'Erro ao atualizar embarcação: ' + error.message });
  }
});

// Excluir embarcação (Exclui automaticamente os certificados associados via CASCADE)
app.delete('/api/embarcacoes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM embarcacoes WHERE id = $1', [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Embarcação não encontrada.' });
    }

    return res.json({ success: true, message: 'Embarcação removida com sucesso.' });
  } catch (error: any) {
    return res.status(500).json({ error: 'Erro ao remover embarcação: ' + error.message });
  }
});

// Adicionar certificado/teste a uma embarcação
app.post('/api/certificados', async (req, res) => {
  try {
    const { 
      embarcacao_id, 
      vessel_id,
      categoria,
      tipo, 
      tipo_teste,
      numero, 
      data_emissao, 
      data_validade,
      data_vencimento, 
      status, 
      orgao_emissor, 
      responsavel_tecnico,
      tipo_vistoria, 
      numero_art,
      fabricante_equipamento,
      modelo_equipamento,
      numero_serie_equipamento,
      faixa_medicao,
      tracao_estatica_ton,
      marca_agulha,
      serie_agulha,
      local_compensacao,
      pressao_trabalho,
      pressao_teste,
      lacre_tag,
      tanque_vinculado,
      continuidade_eletrica,
      laboratorio_calibracao,
      arquivo_anexo_url,
      observacoes 
    } = req.body;

    const embId = embarcacao_id || vessel_id;
    const vencimento = data_vencimento || data_validade;

    if (!embId || !tipo || !vencimento) {
      return res.status(400).json({ error: 'Embarcação, tipo de certificado e data de vencimento são obrigatórios.' });
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
        categoria || 'CERTIFICADO',
        tipo, 
        tipo_teste || null,
        numero || null, 
        data_emissao || null, 
        vencimento, 
        status || 'valido', 
        orgao_emissor || null, 
        responsavel_tecnico || null,
        tipo_vistoria || null, 
        numero_art || null,
        fabricante_equipamento || null,
        modelo_equipamento || null,
        numero_serie_equipamento || null,
        faixa_medicao || null,
        tracao_estatica_ton || null,
        marca_agulha || null,
        serie_agulha || null,
        local_compensacao || null,
        pressao_trabalho || null,
        pressao_teste || null,
        lacre_tag || null,
        tanque_vinculado || null,
        continuidade_eletrica || null,
        laboratorio_calibracao || null,
        arquivo_anexo_url || null,
        observacoes || null
      ]
    );

    return res.status(201).json({
      id: rows[0].id,
      embarcacao_id: embId,
      vessel_id: embId,
      categoria: categoria || 'CERTIFICADO',
      tipo,
      ...req.body
    });
  } catch (error: any) {
    return res.status(500).json({ error: 'Erro ao cadastrar certificado: ' + error.message });
  }
});

// Atualizar certificado/teste existente
app.put('/api/certificados/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      embarcacao_id, 
      vessel_id,
      categoria,
      tipo, 
      tipo_teste,
      numero, 
      data_emissao, 
      data_validade,
      data_vencimento, 
      status, 
      orgao_emissor, 
      responsavel_tecnico,
      tipo_vistoria, 
      numero_art,
      fabricante_equipamento,
      modelo_equipamento,
      numero_serie_equipamento,
      faixa_medicao,
      tracao_estatica_ton,
      marca_agulha,
      serie_agulha,
      local_compensacao,
      pressao_trabalho,
      pressao_teste,
      lacre_tag,
      tanque_vinculado,
      continuidade_eletrica,
      laboratorio_calibracao,
      arquivo_anexo_url,
      observacoes 
    } = req.body;

    const embId = embarcacao_id || vessel_id;
    const vencimento = data_vencimento || data_validade;

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
        categoria || 'CERTIFICADO',
        tipo, 
        tipo_teste || null,
        numero || null, 
        data_emissao || null, 
        vencimento, 
        status || 'valido', 
        orgao_emissor || null, 
        responsavel_tecnico || null,
        tipo_vistoria || null, 
        numero_art || null,
        fabricante_equipamento || null,
        modelo_equipamento || null,
        numero_serie_equipamento || null,
        faixa_medicao || null,
        tracao_estatica_ton || null,
        marca_agulha || null,
        serie_agulha || null,
        local_compensacao || null,
        pressao_trabalho || null,
        pressao_teste || null,
        lacre_tag || null,
        tanque_vinculado || null,
        continuidade_eletrica || null,
        laboratorio_calibracao || null,
        arquivo_anexo_url || null,
        observacoes || null,
        id
      ]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Certificado não encontrado.' });
    }

    return res.json({ id, ...req.body });
  } catch (error: any) {
    return res.status(500).json({ error: 'Erro ao atualizar certificado: ' + error.message });
  }
});

// Excluir certificado
app.delete('/api/certificados/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM certificados WHERE id = $1', [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Certificado não encontrado.' });
    }

    return res.json({ success: true, message: 'Certificado removido com sucesso.' });
  } catch (error: any) {
    return res.status(500).json({ error: 'Erro ao remover certificado: ' + error.message });
  }
});

// Consultor Regulatório Marítimo com IA Gemini
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
    console.error('Erro no consultor AI:', error);
    return res.status(500).json({
      error: 'Falha ao processar a consulta marítima: ' + (error?.message || 'Erro desconhecido')
    });
  }
});

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    // Modo desenvolvimento com middleware Vite
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: process.env.DISABLE_HMR !== 'true' },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Modo produção servindo build estático
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