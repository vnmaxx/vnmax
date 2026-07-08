// /api/analyze — modo Documentos do VNMAX Copilot. O frontend envia apenas os
// NOMES dos arquivos (o conteúdo não sobe); o assistente orienta com base
// neles (streaming SSE). Lógica compartilhada em _copilot.js.
import { makeStreamHandler } from './_copilot.js';

export const config = { supportsResponseStreaming: true };

export default makeStreamHandler('analyze', { maxTokens: 1200 });
