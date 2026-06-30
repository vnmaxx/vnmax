// Worker de edicao de video — FFmpeg-only (LEVE). Usa o binario do pacote npm
// `ffmpeg-static` (sem Chrome, sem root, sem yt-dlp/whisper/claude). Faz o que
// importa de "cortes/montagens": entrada (upload no inbox ou URL https) -> 9:16,
// normaliza audio (-14 LUFS), color grade, queima legendas (ASS do roteiro) e uma
// intro opcional de marca (title card via libass) -> final.mp4, em UMA passada de
// FFmpeg (a intro adiciona 2 passadas curtas).
//
// SEGURANCA: todo processo roda via spawn(bin, [args]) — sem shell, sem injecao.
// Entradas e caminhos sao validados (anti path traversal); cada job roda isolado.
import { spawn } from 'node:child_process';
import { mkdir, copyFile, rm, writeFile } from 'node:fs/promises';
import { createWriteStream, existsSync } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';
import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, basename, join, sep } from 'node:path';
import { updateJob } from './jobs.js';
import { buildAss, buildIntroAss } from './subtitles.js';

// Import DEFENSIVO do binario do FFmpeg: se o pacote nao estiver instalado (deploy
// sem `npm install`), o servidor NAO quebra — o resto (chat/social) segue, e o
// worker apenas reporta indisponivel.
let FFMPEG = null;
try { FFMPEG = (await import('ffmpeg-static')).default || null; }
catch { console.warn('[video] ffmpeg-static ausente — rode `npm install` em server/. Worker de vídeo indisponível.'); }

const __dirname = dirname(fileURLToPath(import.meta.url));
const WORK = resolve(__dirname, 'work');
const INBOX = resolve(__dirname, 'inbox');
const OUTPUT = resolve(__dirname, 'output');
export const VIDEO_OUTPUT_DIR = OUTPUT;

const PUBLIC_BASE = (process.env.VIDEO_PUBLIC_BASE || process.env.PUBLIC_BASE_URL || '').replace(/\/+$/, '');
const MAX_JOB_MS = Number(process.env.VIDEO_JOB_TIMEOUT_MS || 20 * 60 * 1000);
const MAX_INPUT_BYTES = Number(process.env.VIDEO_MAX_INPUT_MB || 600) * 1024 * 1024;

// ---- processo (sem shell) ----
function run(args, { cwd, timeoutMs = MAX_JOB_MS, capture = false } = {}) {
  return new Promise((resolveP, reject) => {
    if (!FFMPEG) return reject(new Error('FFmpeg indisponível (instale a dependência ffmpeg-static).'));
    let p;
    try { p = spawn(FFMPEG, args, { cwd, stdio: ['ignore', 'ignore', 'pipe'] }); }
    catch (e) { return reject(e); }
    let err = '';
    const to = setTimeout(() => { try { p.kill('SIGKILL'); } catch {} reject(new Error('FFmpeg: timeout')); }, timeoutMs);
    p.stderr.on('data', (d) => { err += d; if (err.length > 200000) err = err.slice(-200000); });
    p.on('error', (e) => { clearTimeout(to); reject(e); });
    p.on('close', (code) => {
      clearTimeout(to);
      if (capture) return resolveP({ code, err });             // probe: nao rejeita
      code === 0 ? resolveP({ err }) : reject(new Error(`FFmpeg saiu ${code}: ${err.slice(-300)}`));
    });
  });
}

let TOOLS = null;
export async function detectTools() {
  if (TOOLS) return TOOLS;
  TOOLS = { ffmpeg: Boolean(FFMPEG) };
  return TOOLS;
}

// ---- validacao de entradas ----
function safeInbox(name) {
  const b = basename(String(name || ''));
  if (!b || b.startsWith('.') || !/^[\w .()-]+\.[A-Za-z0-9]{2,4}$/.test(b)) return null;
  const p = resolve(INBOX, b);
  return p.startsWith(INBOX + sep) ? p : null;
}
// Anti-SSRF: bloqueia IPs internos (loopback/privados/link-local/metadata/CGNAT).
function isPrivateIp(ip) {
  if (!ip) return true;
  if (ip.includes(':')) {
    const low = ip.toLowerCase();
    if (low === '::1' || low === '::') return true;
    if (low.startsWith('fe80') || low.startsWith('fc') || low.startsWith('fd')) return true;
    const m = /::ffff:(\d+\.\d+\.\d+\.\d+)/.exec(low);
    if (m) return isPrivateIp(m[1]);
    return false;
  }
  const p = ip.split('.').map(Number);
  if (p.length !== 4 || p.some((n) => Number.isNaN(n))) return true;
  const [a, b, c] = p;
  if (a === 0 || a === 10 || a === 127) return true;
  if (a === 169 && b === 254) return true;                 // link-local + metadata cloud
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 100 && b >= 64 && b <= 127) return true;       // CGNAT (ex.: Tailscale)
  if (a === 192 && b === 0 && c === 0) return true;
  if (a >= 224) return true;                               // multicast/reservado
  return false;
}
// Allowlist positiva opcional (mais robusta): VIDEO_URL_ALLOWED_HOSTS=youtube.com,vimeo.com
const ALLOW_HOSTS = (process.env.VIDEO_URL_ALLOWED_HOSTS || '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);

async function assertSafeUrl(u) {
  const url = new URL(String(u || ''));
  if (url.protocol !== 'https:') throw new Error('URL inválida (use https).');
  const host = url.hostname.toLowerCase();
  if (ALLOW_HOSTS.length) {
    if (!ALLOW_HOSTS.some((h) => host === h || host.endsWith('.' + h))) throw new Error('Host não permitido para download.');
    return url;
  }
  if (host === 'localhost') throw new Error('Host bloqueado.');
  if (isIP(host)) { if (isPrivateIp(host)) throw new Error('IP interno bloqueado.'); return url; }
  const addrs = await lookup(host, { all: true });
  if (!addrs.length || addrs.some((x) => isPrivateIp(x.address))) throw new Error('Host resolve para IP interno.');
  return url;
}

// Download via fetch nativo (https), com teto de tamanho e SSRF guard por hop.
async function download(startUrl, dest) {
  let url = await assertSafeUrl(startUrl);
  for (let hop = 0; hop < 5; hop++) {
    const res = await fetch(url.href, { redirect: 'manual' });
    const loc = res.headers.get('location');
    if (res.status >= 300 && res.status < 400 && loc) { url = await assertSafeUrl(new URL(loc, url).href); continue; }
    if (!res.ok || !res.body) throw new Error(`Falha ao baixar (${res.status}).`);
    const len = Number(res.headers.get('content-length') || 0);
    if (len && len > MAX_INPUT_BYTES) throw new Error('Vídeo grande demais.');
    let total = 0;
    const reader = Readable.fromWeb(res.body);
    reader.on('data', (c) => { total += c.length; if (total > MAX_INPUT_BYTES) reader.destroy(new Error('Vídeo grande demais.')); });
    await pipeline(reader, createWriteStream(dest));
    return;
  }
  throw new Error('Muitos redirecionamentos.');
}

async function probeDuration(input, cwd) {
  const { err } = await run(['-i', input], { cwd, timeoutMs: 60000, capture: true });
  const m = /Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/.exec(err || '');
  if (!m) return 0;
  return (+m[1]) * 3600 + (+m[2]) * 60 + parseFloat(m[3]);
}

const COLOR = {
  cinematic: 'eq=contrast=1.08:brightness=0.02:saturation=1.18,unsharp=3:3:0.4',
  neutral: 'eq=contrast=1.03:saturation=0.97',
};
const ENC = ['-c:v', 'libx264', '-preset', 'veryfast', '-crf', '21', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart'];

async function note(id, notes, msg) { notes.push(msg); await updateJob(id, { progress: msg }); }

export async function processJob(job) {
  const id = String(job.id).replace(/[^A-Za-z0-9_-]/g, '');
  if (!FFMPEG) throw new Error('FFmpeg indisponível no servidor.');
  const dir = join(WORK, id);
  const notes = [];
  await mkdir(dir, { recursive: true });
  await mkdir(OUTPUT, { recursive: true });
  try {
    const opt = job.options || {};

    // 1) Entrada -> input.mp4
    await note(id, notes, 'Obtendo o vídeo…');
    const inputPath = join(dir, 'input.mp4');
    if (job.source?.type === 'inbox') {
      const src = safeInbox(job.source.value);
      if (!src || !existsSync(src)) throw new Error('Arquivo do inbox inválido ou inexistente.');
      await copyFile(src, inputPath);
    } else {
      await download(job.source?.value, inputPath);   // assertSafeUrl (anti-SSRF) interno
    }

    // 2) Duracao + legendas (ASS do roteiro)
    const dur = await probeDuration(inputPath, dir);
    let assName = null;
    const roteiro = String(opt.roteiro || job.instructions || '').trim();
    if (opt.subtitles && roteiro) {
      const ass = buildAss(roteiro, dur, { wordsPerCue: opt.wordsPerCue, upper: opt.upper });
      if (ass) { assName = 'subs.ass'; await writeFile(join(dir, assName), ass, 'utf8'); }
    }

    // 3) Monta a cadeia de filtros (1 passada)
    await note(id, notes, 'Editando (FFmpeg)…');
    const vf = [];
    if (opt.vertical) vf.push('scale=1080:1920:force_original_aspect_ratio=increase', 'crop=1080:1920', 'setsar=1');
    if (opt.color && COLOR[opt.color]) vf.push(COLOR[opt.color]);
    if (assName) vf.push(`ass=${assName}`);          // relativo ao cwd=dir (sem escaping de path)
    const af = opt.normalize ? ['-af', 'loudnorm=I=-14:TP=-1.5:LRA=11'] : [];

    const mainOut = join(dir, 'main.mp4');
    const args = ['-y', '-i', inputPath, ...(vf.length ? ['-vf', vf.join(',')] : []), ...af, ...ENC, mainOut];
    await run(args, { cwd: dir });
    let cur = mainOut;

    // 4) Intro de marca (opcional, title card via libass — sem Chrome)
    if (opt.intro) {
      await note(id, notes, 'Gerando intro…');
      const introAss = buildIntroAss(opt.introTitle || 'VNMAX', opt.introSubtitle || '');
      await writeFile(join(dir, 'intro.ass'), introAss, 'utf8');
      const introMp4 = join(dir, 'intro.mp4');
      await run(['-y', '-f', 'lavfi', '-i', 'color=c=0x050505:s=1080x1920:r=30:d=2.6',
        '-f', 'lavfi', '-i', 'anullsrc=channel_layout=stereo:sample_rate=44100',
        '-vf', 'ass=intro.ass', '-shortest', ...ENC, introMp4], { cwd: dir });
      // normaliza a main pro mesmo formato e concatena
      const joined = join(dir, 'joined.mp4');
      await run(['-y', '-i', introMp4, '-i', cur, '-filter_complex',
        '[0:v]scale=1080:1920,setsar=1[v0];[1:v]scale=1080:1920,setsar=1[v1];[v0][0:a][v1][1:a]concat=n=2:v=1:a=1[v][a]',
        '-map', '[v]', '-map', '[a]', ...ENC, joined], { cwd: dir });
      cur = joined;
    }

    // 5) Saida publica
    await note(id, notes, 'Finalizando…');
    const rand = Math.abs((Date.now() ^ (id.length * 2654435761)) >>> 0).toString(36) + id.slice(-4);
    const outName = `${id}-${rand}.mp4`;
    const outPath = join(OUTPUT, outName);
    await copyFile(cur, outPath);

    const outputUrl = PUBLIC_BASE ? `${PUBLIC_BASE}/video/output/${outName}` : `/video/output/${outName}`;
    await updateJob(id, { status: 'pronto', progress: 'Pronto.', outputUrl, outputFile: outName, notes, error: null });
    return { outputUrl };
  } finally {
    try { await rm(dir, { recursive: true, force: true }); } catch {}
  }
}

// Serve um MP4 de OUTPUT (anti path traversal). Retorna {path} ou null.
export function resolveOutput(name) {
  const b = basename(String(name || ''));
  if (!/^[A-Za-z0-9_-]+\.mp4$/.test(b)) return null;
  const p = resolve(OUTPUT, b);
  return p.startsWith(OUTPUT + sep) ? p : null;
}

let running = false;
export function startWorker(claimNext) {
  if (process.env.VIDEO_WORKER_ENABLED !== 'true') { console.log('[video] worker desativado (defina VIDEO_WORKER_ENABLED=true).'); return; }
  if (!FFMPEG) { console.warn('[video] ffmpeg-static ausente — worker nao processara. Rode npm install em server/.'); return; }
  const tick = async () => {
    if (running) return;
    running = true;
    try {
      const job = await claimNext();
      if (job) {
        console.log('[video] processando job', job.id);
        try { await processJob(job); console.log('[video] job', job.id, 'pronto'); }
        catch (e) { console.error('[video] job', job.id, 'erro:', e.message); await updateJob(job.id, { status: 'erro', error: e.message, progress: 'Erro.' }).catch(() => {}); }
      }
    } catch (e) { console.error('[video] worker tick:', e.message); }
    finally { running = false; }
  };
  setInterval(tick, Number(process.env.VIDEO_POLL_MS || 5000)).unref();
  console.log('[video] worker ativo (FFmpeg-only).');
}
