import { supabase } from './supabaseClient';

/**
 * Envia um arquivo PDF/Imagem para o bucket privado no Supabase Storage
 */
export async function uploadCertificadoPDF(
  file: File, 
  vesselId: string
): Promise<{ url: string; path: string }> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${vesselId}/${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
  const filePath = `${fileName}`;

  // Upload do arquivo para o bucket privado
  const { data, error } = await supabase.storage
    .from('certificados-docs')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) {
    throw new Error(`Falha no upload do documento: ${error.message}`);
  }

  // Gera uma URL assinada temporária (válida por 2 horas) para visualização segura
  const { data: urlData, error: urlError } = await supabase.storage
    .from('certificados-docs')
    .createSignedUrl(filePath, 7200);

  if (urlError || !urlData) {
    throw new Error(`Erro ao gerar link de acesso ao documento: ${urlError?.message}`);
  }

  return { url: urlData.signedUrl, path: filePath };
}

/**
 * Renova a URL assinada de um documento já armazenado
 */
export async function obterUrlTemporariaDocumento(path: string): Promise<string | null> {
  if (!path) return null;

  const { data, error } = await supabase.storage
    .from('certificados-docs')
    .createSignedUrl(path, 7200);

  if (error || !data) {
    console.error("Erro ao renovar URL assinada:", error);
    return null;
  }

  return data.signedUrl;
}