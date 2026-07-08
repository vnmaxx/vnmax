// /api/ceo — modo CEO AI do VNMAX Copilot: análise estratégica executiva
// (streaming SSE). Lógica compartilhada em _copilot.js.
import { makeStreamHandler } from './_copilot.js';

export const config = { supportsResponseStreaming: true };

export default makeStreamHandler('ceo', { maxTokens: 2000 });
