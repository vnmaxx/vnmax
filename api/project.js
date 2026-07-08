// /api/project — modo Projeto do VNMAX Copilot: leitura do briefing e proposta
// de abordagem (streaming SSE). Lógica compartilhada em _copilot.js.
import { makeStreamHandler } from './_copilot.js';

export const config = { supportsResponseStreaming: true };

export default makeStreamHandler('project', { maxTokens: 1600 });
