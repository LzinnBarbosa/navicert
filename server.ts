import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import Database from 'better-sqlite3';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const portArgIndex = process.argv.indexOf('--port');
const port = portArgIndex !== -1 ? parseInt(process.argv[portArgIndex + 1], 10) : 3000;

app.use(express.json({ limit: '10mb' }));

// --- INICIALIZAÇÃO DO BANCO DE DADOS SQLITE ---
const db = new Database('navcert.db');
db.pragma('foreign_keys = ON');

// Criação das tabelas com schema completo e atualizado
db.exec(`
  CREATE TABLE IF NOT EXISTS embarcacoes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    inscricao TEXT NOT NULL UNIQUE,
    tipo TEXT NOT NULL,
    situacao TEXT DEFAULT 'Ativa',
    proprietario TEXT,
    construtor TEXT,
    ano_construcao INTEGER,
    trecho TEXT,
    porto_inscricao TEXT,
    arqueacao_bruta REAL,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS certificados (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    embarcacao_id INTEGER NOT NULL,
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
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (embarcacao_id) REFERENCES embarcacoes(id) ON DELETE CASCADE
  );
`);

// Função de segurança de migração: garante novas colunas caso o arquivo navcert.db já existisse
function garantirEsquemaBD() {
  try {
    const colunasEmb = db.prepare("PRAGMA table_info(embarcacoes)").all().map((c: any) => c.name);
    const camposEmb: [string, string][] = [
      ['situacao', "TEXT DEFAULT 'Ativa'"],
      ['proprietario', 'TEXT'],
      ['construtor', 'TEXT'],
      ['ano_construcao', 'INTEGER'],
      ['trecho', 'TEXT'],
      ['porto_inscricao', 'TEXT'],
      ['arqueacao_bruta', 'REAL']
    ];
    camposEmb.forEach(([col, def]) => {
      if (!colunasEmb.includes(col)) {
        db.exec(`ALTER TABLE embarcacoes ADD COLUMN ${col} ${def}`);
      }
    });

    const colunasCert = db.prepare("PRAGMA table_info(certificados)").all().map((c: any) => c.name);
    const camposCert: [string, string][] = [
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
    camposCert.forEach(([col, def]) => {
      if (!colunasCert.includes(col)) {
        db.exec(`ALTER TABLE certificados ADD COLUMN ${col} ${def}`);
      }
    });
  } catch (err) {
    console.warn('Aviso na verificação do esquema SQLite:', err);
  }
}
garantirEsquemaBD();

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', database: 'SQLite conectado', time: new Date().toISOString() });
});

// --- ROTAS DO BANCO DE DADOS (EMBARCAÇÕES E CERTIFICADOS) ---

// Listar todas as embarcações com seus certificados vinculados
app.get('/api/embarcacoes', (_req, res) => {
  try {
    const embarcacoes = db.prepare('SELECT * FROM embarcacoes ORDER BY nome ASC').all();
    const resultado = embarcacoes.map((emb: any) => {
      const certificados = db.prepare('SELECT * FROM certificados WHERE embarcacao_id = ?').all(emb.id);
      return { ...emb, certificados };
    });
    return res.json(resultado);
  } catch (error: any) {
    return res.status(500).json({ error: 'Erro ao buscar embarcações: ' + error.message });
  }
});

// Cadastrar nova embarcação
app.post('/api/embarcacoes', (req, res) => {
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

    const stmt = db.prepare(`
      INSERT INTO embarcacoes (
        nome, inscricao, tipo, situacao, proprietario, construtor, ano_construcao, trecho, porto_inscricao, arqueacao_bruta
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const info = stmt.run(
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
    );

    return res.status(201).json({ 
      id: info.lastInsertRowid, 
      ...req.body, 
      certificados: [] 
    });
  } catch (error: any) {
    return res.status(500).json({ error: 'Erro ao cadastrar embarcação: ' + error.message });
  }
});

// Atualizar dados de uma embarcação existente
app.put('/api/embarcacoes/:id', (req, res) => {
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

    const stmt = db.prepare(`
      UPDATE embarcacoes SET
        nome = ?,
        inscricao = ?,
        tipo = ?,
        situacao = ?,
        proprietario = ?,
        construtor = ?,
        ano_construcao = ?,
        trecho = ?,
        porto_inscricao = ?,
        arqueacao_bruta = ?
      WHERE id = ?
    `);

    const info = stmt.run(
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
    );

    if (info.changes === 0) {
      return res.status(404).json({ error: 'Embarcação não encontrada.' });
    }

    return res.json({ id, ...req.body });
  } catch (error: any) {
    return res.status(500).json({ error: 'Erro ao atualizar embarcação: ' + error.message });
  }
});

// Excluir embarcação (Exclui automaticamente os certificados associados via CASCADE)
app.delete('/api/embarcacoes/:id', (req, res) => {
  try {
    const { id } = req.params;
    const stmt = db.prepare('DELETE FROM embarcacoes WHERE id = ?');
    const info = stmt.run(id);

    if (info.changes === 0) {
      return res.status(404).json({ error: 'Embarcação não encontrada.' });
    }

    return res.json({ success: true, message: 'Embarcação removida com sucesso.' });
  } catch (error: any) {
    return res.status(500).json({ error: 'Erro ao remover embarcação: ' + error.message });
  }
});

// Adicionar certificado/teste a uma embarcação
app.post('/api/certificados', (req, res) => {
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

    const stmt = db.prepare(`
      INSERT INTO certificados (
        embarcacao_id, categoria, tipo, tipo_teste, numero, data_emissao, data_vencimento, status, 
        orgao_emissor, responsavel_tecnico, tipo_vistoria, numero_art, fabricante_equipamento, 
        modelo_equipamento, numero_serie_equipamento, faixa_medicao, tracao_estatica_ton, marca_agulha, 
        serie_agulha, local_compensacao, pressao_trabalho, pressao_teste, lacre_tag, tanque_vinculado, 
        continuidade_eletrica, laboratorio_calibracao, arquivo_anexo_url, observacoes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const info = stmt.run(
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
    );

    return res.status(201).json({
      id: info.lastInsertRowid,
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
app.put('/api/certificados/:id', (req, res) => {
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

    const stmt = db.prepare(`
      UPDATE certificados SET
        embarcacao_id = ?,
        categoria = ?,
        tipo = ?,
        tipo_teste = ?,
        numero = ?,
        data_emissao = ?,
        data_vencimento = ?,
        status = ?,
        orgao_emissor = ?,
        responsavel_tecnico = ?,
        tipo_vistoria = ?,
        numero_art = ?,
        fabricante_equipamento = ?,
        modelo_equipamento = ?,
        numero_serie_equipamento = ?,
        faixa_medicao = ?,
        tracao_estatica_ton = ?,
        marca_agulha = ?,
        serie_agulha = ?,
        local_compensacao = ?,
        pressao_trabalho = ?,
        pressao_teste = ?,
        lacre_tag = ?,
        tanque_vinculado = ?,
        continuidade_eletrica = ?,
        laboratorio_calibracao = ?,
        arquivo_anexo_url = ?,
        observacoes = ?
      WHERE id = ?
    `);

    const info = stmt.run(
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
    );

    if (info.changes === 0) {
      return res.status(404).json({ error: 'Certificado não encontrado.' });
    }

    return res.json({ id, ...req.body });
  } catch (error: any) {
    return res.status(500).json({ error: 'Erro ao atualizar certificado: ' + error.message });
  }
});

// Excluir certificado
app.delete('/api/certificados/:id', (req, res) => {
  try {
    const { id } = req.params;
    const stmt = db.prepare('DELETE FROM certificados WHERE id = ?');
    const info = stmt.run(id);

    if (info.changes === 0) {
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