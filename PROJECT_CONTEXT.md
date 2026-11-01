# CONTEXTO E DIRETRIZES DO PROJETO NAVCERT

Você é o assistente técnico especialista no projeto **NavCert**. Sempre siga as regras abaixo para manter a consistência do código e evitar incompatibilidades de infraestrutura.

---

## 1. INFRAESTRUTURA & STACK TÉCNICO
- **Backend:** Express.js + Node.js (arquivo principal `server.ts`).
- **Banco de Dados:** **SQLite local** via `better-sqlite3` (arquivo `navcert.db`).
  - **ATENÇÃO:** PROIBIDO sugerir PostgreSQL, MySQL, Supabase ou outros bancos externos.
  - As alterações de BD usam a função `garantirEsquemaBD()` no `server.ts` com comandos `ALTER TABLE` individuais compatíveis com SQLite.
- **Frontend:** React + TypeScript + Tailwind CSS + Lucide Icons.
- **IA:** Google GenAI (Gemini 3.8 Flash) via rota `/api/orientacao`.

---

## 2. ARQUIVOS E ESTRUTURAS ATUALIZADAS

### A. Tipagens (`src/types/maritime.ts`)
- A interface `Certificate` e os tipos foram estendidos para suportar:
  - **Vistorias Navais (CSN, BL, Casco, Máquinas):** Ciclos de convalidação específicos (`1ª Vistoria Anual`, `MC1`, `Renovação de Classe / Docagem`, etc.).
  - **ART do CREA:** Campo `numero_art`.
  - **Campos Dinâmicos de Laudos:** `marca_agulha`, `serie_agulha`, `local_compensacao`, `pressao_trabalho`, `pressao_teste`, `lacre_tag`, `tanque_vinculado`, `continuidade_eletrica`, `laboratorio_calibracao`.

### B. Formulário Polimórfico (`src/components/CertificateFormModal.tsx`)
- Formulário dinâmico que exibe/oculta campos de acordo com o `tipo` do documento selecionado:
  - **CSN / BL / CASCO / MAQUINAS:** Exibe seleção do ciclo de vistoria e Sociedade Classificadora.
  - **COMPENSACAO_AGULHA:** Exibe marca, série e local.
  - **MANGOTES:** Exibe dimensões, lacre/TAG, pressão de teste e continuidade elétrica.
  - **VALVULAS (PV):** Exibe TAG, tanque vinculado e laboratório acreditado.

### C. Servidor Backend (`server.ts`)
- Schema do SQLite atualizado com auto-migração via `PRAGMA table_info`.
- Rotas `POST /api/certificados` e `PUT /api/certificados/:id` preparadas para receber e persistir todos os campos dinâmicos e de vistoria.

---

## 3. REGRAS DE DESENVOLVIMENTO
1. Mantenha todas as interações e consultas focadas em **SQLite**.
2. Preserve a validação condicional de campos no frontend para evitar formulários poluídos.
3. Certifique-se de que qualquer novo campo adicionado no frontend seja mapeado na interface `Certificate` (`maritime.ts`) e no `server.ts`.