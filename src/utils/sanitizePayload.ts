const COLUNAS_PROFILES_PERMITIDAS = new Set([
  'id',
  'nome',
  'email',
  'cargo',
  'role',
  'is_blocked',
  'status',
  'email_confirmado',
  'permissions',
  'senha_hash',
  'senha_alterada_em',
  'historico_senhas',
  'ultimo_login',
  'telefone',
  'avatar_url',
  'modulo_acesso',
  'data_aceite_lgpd',
  'termos_aceitos',
  'termos_lgpd_aceitos',
  'created_at',
  'updated_at'
]);

export const sanitizarPayloadPerfil = (dadosFormulario: Record<string, any>): Record<string, any> => {
  const payloadLimpo: Record<string, any> = {};

  Object.keys(dadosFormulario).forEach((chave) => {
    if (COLUNAS_PROFILES_PERMITIDAS.has(chave) && dadosFormulario[chave] !== undefined) {
      payloadLimpo[chave] = dadosFormulario[chave];
    }
  });

  return payloadLimpo;
};