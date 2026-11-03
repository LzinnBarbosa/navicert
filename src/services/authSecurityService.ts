import { supabase } from '../lib/supabaseClient';

const DIAS_EXPIRACAO_SENHA = 30;
const MAX_HISTORICO_SENHAS = 5;

/**
 * 1. VERIFICA SE A SENHA EXPIROU (REGRA DOS 30 DIAS)
 */
export const verificarExpiracaoSenha = (senhaAlteradaEm?: string): { expirada: boolean; diasRestantes: number } => {
  if (!senhaAlteradaEm) {
    return { expirada: true, diasRestantes: 0 };
  }

  const dataUltimaTroca = new Date(senhaAlteradaEm);
  const dataAtual = new Date();
  const diferencaEmMilissegundos = dataAtual.getTime() - dataUltimaTroca.getTime();
  const diasPassados = Math.floor(diferencaEmMilissegundos / (1000 * 60 * 60 * 24));
  const diasRestantes = Math.max(0, DIAS_EXPIRACAO_SENHA - diasPassados);

  return {
    expirada: diasPassados >= DIAS_EXPIRACAO_SENHA,
    diasRestantes
  };
};

/**
 * 2. ALTERAÇÃO DE SENHA COM VALIDAÇÃO DE HISTÓRICO (IMPEDE REUSO)
 */
export const atualizarSenhaComHistorico = async (
  userId: string,
  novaSenhaHash: string
): Promise<{ success: boolean; message: string }> => {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('senha_hash, historico_senhas')
    .eq('id', userId)
    .single();

  if (error || !profile) {
    throw new Error('Não foi possível localizar as credenciais do usuário.');
  }

  const senhaAtual = profile.senha_hash;
  const historico: string[] = Array.isArray(profile.historico_senhas) ? profile.historico_senhas : [];

  // Rejeita se for igual à atual ou a qualquer uma presente no histórico
  if (novaSenhaHash === senhaAtual || historico.includes(novaSenhaHash)) {
    return {
      success: false,
      message: 'Por política de segurança, você não pode utilizar uma senha usada recentemente. Escolha uma nova senha.'
    };
  }

  // Atualiza a lista de histórico (máximo 5 registros)
  const novoHistorico = senhaAtual
    ? [senhaAtual, ...historico].slice(0, MAX_HISTORICO_SENHAS)
    : historico;

  const { error: updateError } = await supabase
    .from('profiles')
    .update({
      senha_hash: novaSenhaHash,
      senha_alterada_em: new Date().toISOString(),
      historico_senhas: novoHistorico,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId);

  if (updateError) {
    console.error('Erro ao registrar nova senha:', updateError);
    throw updateError;
  }

  return {
    success: true,
    message: 'Senha atualizada com sucesso!'
  };
};

/**
 * 3. VALIDAÇÃO DE LOGIN E CHECAGEM DE CADASTRO
 */
export const autenticarPorEmail = async (email: string) => {
  const emailFormatado = email.trim().toLowerCase();

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', emailFormatado)
    .maybeSingle();

  if (error) {
    throw new Error('Falha na comunicação com o servidor de autenticação.');
  }

  // Usuário não cadastrado
  if (!profile) {
    return {
      status: 'NAO_CADASTRADO' as const,
      message: 'Usuário não cadastrado na plataforma. Por favor, solicite seu cadastro para obter acesso.'
    };
  }

  const checagemSenha = verificarExpiracaoSenha(profile.senha_alterada_em);

  return {
    status: 'SUCESSO' as const,
    profile,
    precisaRedefinirSenha: checagemSenha.expirada,
    diasRestantesSenha: checagemSenha.diasRestantes
  };
};

/**
 * 4. SOLICITAÇÃO DE RECUPERAÇÃO DE SENHA ("Esqueceu a Senha?")
 */
export const solicitarRecuperacaoSenha = async (email: string): Promise<{ success: boolean; message: string }> => {
  const emailFormatado = email.trim().toLowerCase();

  // Verifica primeiro se o e-mail existe no cadastro
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, email, status, is_blocked')
    .eq('email', emailFormatado)
    .maybeSingle();

  if (error) {
    throw new Error('Erro ao consultar o banco de dados.');
  }

  if (!profile) {
    return {
      success: false,
      message: 'E-mail não encontrado no sistema. Verifique o endereço digitado ou realize seu cadastro.'
    };
  }

  if (profile.is_blocked || profile.status === 'bloqueado') {
    return {
      success: false,
      message: 'Sua conta está suspensa/bloqueada. Entre em contato com a administração.'
    };
  }

  // Dispara o e-mail oficial de redefinição de senha pelo Supabase Auth
  const { error: resetError } = await supabase.auth.resetPasswordForEmail(emailFormatado, {
    redirectTo: `${window.location.origin}/reset-password`
  });

  if (resetError) {
    console.error('Erro no Supabase Auth Reset:', resetError);
  }

  return {
    success: true,
    message: 'Link de redefinição de senha enviado com sucesso! Verifique sua caixa de entrada e SPAM.'
  };
};