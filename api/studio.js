// Proxy serverless (Vercel) — CRM -> Studio-IA Backend.
// A chave fica SO no servidor (env), nunca no frontend.
//
// STUDIO_BRIDGE_URL aponta para o servico do Studio-IA no Render
// (studio-ia-api.onrender.com), que reexpoe as rotas do bridge sob o prefixo
// /api/*. Chamamos o Render (nao o bridge Cloudflare direto) porque o tunel
// Cloudflare do bridge desafia IPs de datacenter (Vercel) com anti-bot.
//   STUDIO_BRIDGE_URL    = https://studio-ia-api.onrender.com
//   STUDIO_BRIDGE_SECRET = <BRIDGE_SECRET>   (chave compartilhada)
//
// SEGURANCA: a allowlist valida o PATH INTEIRO (nao so o 1o segmento),
// e cada parametro (clienteId, etc) e validado antes de ir ao upstream —
// impede path traversal, route confusion e IDOR.

import { authAdmin, ENFORCE } from "./_auth.js";

// Rotas exatas permitidas: CRM, produtos, pendentes.
// ClienteId é restrito a [a-z0-9-].
const PATH_OK = /^(health|crm|crm\/lead|conteudo\/produtos|pendentes)$/;
const SAFE_CLIENT_ID = /^[a-z0-9][a-z0-9-]{0,63}$/i;

const bad = (v) => v == null || v.includes("..") || v.includes("/") || v.includes("\\");

export default async function handler(req, res) {
  const URL = process.env.STUDIO_BRIDGE_URL;
  const SECRET = process.env.STUDIO_BRIDGE_SECRET;

  if (!(URL && SECRET)) {
    return res.status(503).json({ error: "integracao nao configurada" });
  }

  if (!["GET", "POST"].includes(req.method)) return res.status(405).json({ error: "metodo nao permitido" });

  // --- autenticacao do chamador (admin Firebase) ---
  // health é público. Demais rotas exigem admin quando ENFORCE_AUTH=true.
  const rawPath = String(req.query.path || "").replace(/^\/+|\/+$/g, "");
  if (rawPath !== "health") {
    const auth = await authAdmin(req);
    if (!auth.ok) {
      if (ENFORCE) return res.status(auth.status).json({ error: auth.error });
      console.warn("[api/studio] sem auth valida (ENFORCE_AUTH off):", auth.error);
    }
  }

  // --- valida o PATH inteiro contra a allowlist ---
  const raw = String(req.query.path || "").replace(/^\/+|\/+$/g, "");
  if (!PATH_OK.test(raw)) return res.status(400).json({ error: "rota nao permitida" });

  // POST só é aceito na criação de lead
  if (req.method === "POST" && raw !== "crm/lead") return res.status(405).json({ error: "metodo nao permitido nesta rota" });

  // --- valida e reconstroi a query extra (so chaves conhecidas) ---
  const q = req.query;
  const one = (v) => (Array.isArray(v) ? v[0] : v);
  const extra = new URLSearchParams();

  if (q.clienteId != null) {
    const clienteId = String(one(q.clienteId));
    if (!SAFE_CLIENT_ID.test(clienteId)) return res.status(400).json({ error: "clienteId invalido" });
    extra.set("clienteId", clienteId);
  }

  const qs = extra.toString();

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 20000);
  try {
    // O Render expoe as rotas sob /api/*; "health" mapeia para "status".
    const routePath = raw === "health" ? "status" : raw;
    const base = `${URL.replace(/\/+$/, "")}/api/${routePath}`;
    const target = base + (qs ? `?${qs}` : "");
    const headers = {
      "x-bridge-secret": SECRET,
      "Content-Type": "application/json",
    };
    // Repassa o IP do VISITANTE para o Studio-IA, se for necessário geolocalizar
    const clientIp = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim()
      || req.headers["x-real-ip"] || req.socket?.remoteAddress || "";
    if (clientIp) headers["x-client-ip"] = clientIp;

    const init = { method: req.method, headers, redirect: "manual", signal: ctrl.signal };
    if (req.method === "POST") init.body = JSON.stringify(req.body || {});
    const r = await fetch(target, init);

    const buf = Buffer.from(await r.arrayBuffer());
    res.status(r.status);
    const ct = r.headers.get("content-type") || "application/json";
    res.setHeader("Content-Type", ct);
    res.setHeader("X-Content-Type-Options", "nosniff");

    const cd = r.headers.get("content-disposition");
    if (cd) res.setHeader("Content-Disposition", cd);
    res.send(buf);
  } catch (e) {
    const aborted = e?.name === "AbortError";
    console.error("[api/studio] falha:", e?.message);
    res.status(aborted ? 504 : 502).json({ error: aborted ? "tempo esgotado" : "falha ao contatar a integracao" });
  } finally {
    clearTimeout(timer);
  }
}
