// Endpoints da edicao de video (aba Vídeo do portal). Privilegiados: exigem ID
// token do Firebase de um membro da allowlist. Criam/consultam jobs; o worker
// (video/worker.js) processa em background.
import { requireMember } from './auth.js';
import { createJob, listJobs, getJob, deleteJob } from './video/jobs.js';
import { detectTools } from './video/worker.js';

const COLORS = new Set(['none', 'cinematic', 'neutral']);

function buildSource(body) {
  const type = body?.source?.type === 'inbox' ? 'inbox' : 'url';
  const value = String(body?.source?.value || '').trim();
  if (type === 'url') {
    let ok = false; try { ok = new URL(value).protocol === 'https:'; } catch {}
    if (!ok) { const e = new Error('Informe uma URL https do vídeo de entrada.'); e.status = 400; throw e; }
    return { type, value };
  }
  // inbox: so o basename (o worker revalida contra o diretorio inbox).
  if (!value || /[\\/]/.test(value) || value.includes('..')) { const e = new Error('Nome de arquivo do inbox inválido.'); e.status = 400; throw e; }
  return { type: 'inbox', value };
}

function buildOptions(body) {
  const o = body?.options || {};
  const color = COLORS.has(o.color) ? o.color : 'none';
  return {
    vertical: Boolean(o.vertical),                 // 9:16 (crop)
    normalize: Boolean(o.normalize),               // loudnorm -14 LUFS
    color: color === 'none' ? null : color,        // eq cinematic/neutral
    subtitles: Boolean(o.subtitles),               // queima legendas do roteiro
    roteiro: String(o.roteiro || '').trim().slice(0, 4000),
    upper: o.upper !== false,
    intro: Boolean(o.intro),                        // title card de marca (libass)
    introTitle: String(o.introTitle || '').trim().slice(0, 80) || null,
    introSubtitle: String(o.introSubtitle || '').trim().slice(0, 120) || null,
  };
}

export async function handleVideoTools() {
  const t = await detectTools();
  // Pipeline FFmpeg-only: tudo disponivel se o ffmpeg-static estiver presente.
  return {
    tools: t,
    can: {
      ffmpeg: t.ffmpeg,
      vertical: t.ffmpeg, normalize: t.ffmpeg, color: t.ffmpeg, subtitles: t.ffmpeg, intro: t.ffmpeg,
      worker: process.env.VIDEO_WORKER_ENABLED === 'true' && t.ffmpeg,
    },
  };
}

export async function handleVideoCreate(body, member) {
  const source = buildSource(body);
  const options = buildOptions(body);
  const instructions = String(body?.instructions || '').trim().slice(0, 2000);
  return createJob({ source, options, instructions }, member);
}

export async function handleVideoList(member) {
  return { jobs: await listJobs(member, 50) };
}

export async function handleVideoGet(body, member) {
  const job = await getJob(String(body?.id || ''));
  // 404 (nao 403) para nao revelar a existencia de jobs de outros membros.
  if (!job || (job.createdBy && member && job.createdBy !== member.uid)) { const e = new Error('Job não encontrado.'); e.status = 404; throw e; }
  return { job };
}

export async function handleVideoDelete(body, member) {
  return deleteJob(String(body?.id || ''), member);
}

export { requireMember };
