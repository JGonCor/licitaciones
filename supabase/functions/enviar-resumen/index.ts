import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { adminClient, json, validarCron } from "./auth.ts";

const RESEND_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const FROM = Deno.env.get("EMAIL_FROM") ?? "Nexus Licitaciones <alertas@licitaciones.nexuslottery.site>";
const APP_URL = Deno.env.get("APP_URL") ?? "https://licitaciones.nexuslottery.site";
const MAX_POR_CORREO = 40;

type Proceso = {
  id_del_proceso: string; entidad: string | null; departamento: string | null; ciudad: string | null;
  nombre: string | null; descripcion: string | null; modalidad: string | null; tipo_contrato: string | null;
  precio_base: number | null; duracion: string | null; url: string | null; fecha_publicacion: string | null;
};

const cop = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });
const esc = (s: string | null | undefined) =>
  (s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
const corto = (s: string | null, n: number) => !s ? "" : s.length > n ? s.slice(0, n - 1) + "…" : s;

function tarjeta(p: Proceso): string {
  const lugar = [p.ciudad, p.departamento].filter(Boolean).join(", ");
  return `
  <tr><td style="padding:0 0 14px 0">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #e5e7eb;border-radius:10px">
      <tr><td style="padding:16px 18px">
        <div style="font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:.04em">${esc(p.modalidad)} · ${esc(p.tipo_contrato)}</div>
        <a href="${esc(p.url ?? "#")}" style="display:block;margin:6px 0 8px;font-size:16px;font-weight:600;color:#111827;text-decoration:none;line-height:1.35">${esc(corto(p.nombre, 160))}</a>
        <div style="font-size:14px;color:#374151">${esc(p.entidad)}${lugar ? ` — ${esc(lugar)}` : ""}</div>
        <table cellpadding="0" cellspacing="0" style="margin-top:12px"><tr>
          <td style="font-size:18px;font-weight:700;color:#0f766e;padding-right:16px">${p.precio_base ? cop.format(p.precio_base) : "Monto no publicado"}</td>
          <td><a href="${esc(p.url ?? "#")}" style="background:#0f172a;color:#ffffff;font-size:13px;padding:8px 14px;border-radius:6px;text-decoration:none">Ver en SECOP</a></td>
        </tr></table>
      </td></tr>
    </table>
  </td></tr>`;
}

function plantilla(nombre: string | null, procesos: Proceso[], total: number, avisoPlan: string): string {
  const fecha = new Date().toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long", timeZone: "America/Bogota" });
  const suma = procesos.reduce((a, p) => a + (p.precio_base ?? 0), 0);
  return `<!doctype html><html><body style="margin:0;background:#f3f4f6;font-family:Segoe UI,Helvetica,Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px">
  <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%">
    <tr><td style="background:#0f172a;border-radius:12px 12px 0 0;padding:22px 24px">
      <div style="color:#5eead4;font-size:13px;font-weight:600;letter-spacing:.08em">NEXUS LICITACIONES</div>
      <div style="color:#ffffff;font-size:22px;font-weight:700;margin-top:4px">${total} oportunidades nuevas para ti</div>
      <div style="color:#cbd5e1;font-size:14px;margin-top:4px;text-transform:capitalize">${esc(fecha)} · ${cop.format(suma)} en procesos abiertos</div>
    </td></tr>
    <tr><td style="background:#f9fafb;padding:20px 20px 6px">
      <p style="margin:0 0 16px;font-size:15px;color:#374151">Hola${nombre ? ` ${esc(nombre)}` : ""}, estos procesos de SECOP II coinciden con tus filtros y están recibiendo ofertas:</p>
      <table width="100%" cellpadding="0" cellspacing="0">${procesos.map(tarjeta).join("")}</table>
      ${total > procesos.length ? `<p style="font-size:14px;color:#374151">Y ${total - procesos.length} más en <a href="${APP_URL}/panel" style="color:#0f766e">tu panel</a>.</p>` : ""}
    </td></tr>
    <tr><td style="background:#ffffff;border-radius:0 0 12px 12px;padding:18px 24px;font-size:13px;color:#6b7280;border-top:1px solid #e5e7eb">
      ${avisoPlan ? `<p style="margin:0 0 10px;color:#b45309">${avisoPlan}</p>` : ""}
      <a href="${APP_URL}/panel" style="color:#0f766e">Ajustar mis filtros</a> · Datos abiertos de SECOP II (Colombia Compra Eficiente). Verifica siempre las condiciones en el portal oficial.
    </td></tr>
  </table></td></tr></table></body></html>`;
}

async function enviarCorreo(para: string, asunto: string, html: string) {
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: FROM, to: [para], subject: asunto, html }),
  });
  return { ok: r.ok, detalle: r.ok ? "" : await r.text() };
}

Deno.serve(async (req) => {
  const db = adminClient();
  if (!(await validarCron(req, db))) return json({ error: "no autorizado" }, 401);
  if (!RESEND_KEY) return json({ error: "Falta RESEND_API_KEY" }, 500);

  const body = await req.json().catch(() => ({}));
  const soloUsuario: string | undefined = body.user_id;
  const ahora = new Date();

  let q = db.from("perfiles").select("id,email,nombre,plan,prueba_hasta,plan_hasta,ultimo_envio").eq("activo", true);
  if (soloUsuario) q = q.eq("id", soloUsuario);
  const { data: perfiles, error } = await q;
  if (error) return json({ error: error.message }, 500);

  const resultados: unknown[] = [];
  for (const u of perfiles ?? []) {
    const enPrueba = u.plan === "prueba" && new Date(u.prueba_hasta) > ahora;
    const pagado = (u.plan === "basico" || u.plan === "pro") && u.plan_hasta && new Date(u.plan_hasta) > ahora;
    if (!enPrueba && !pagado) continue;

    const desde = u.ultimo_envio ?? new Date(ahora.getTime() - 864e5).toISOString();
    const { data: filtros } = await db.from("filtros").select("id").eq("user_id", u.id).eq("activo", true);

    const unicos = new Map<string, Proceso>();
    for (const f of filtros ?? []) {
      const { data } = await db.rpc("coincidencias_filtro", { p_filtro: f.id, p_desde: desde, p_limite: 200 });
      for (const p of (data ?? []) as Proceso[]) unicos.set(p.id_del_proceso, p);
    }
    const todos = [...unicos.values()].sort((a, b) => (b.precio_base ?? 0) - (a.precio_base ?? 0));

    await db.from("perfiles").update({ ultimo_envio: ahora.toISOString() }).eq("id", u.id);
    if (todos.length === 0) { resultados.push({ email: u.email, enviados: 0 }); continue; }

    const dias = Math.ceil((new Date(u.prueba_hasta).getTime() - ahora.getTime()) / 864e5);
    const aviso = enPrueba ? `Tu prueba gratuita termina en ${dias} día${dias === 1 ? "" : "s"}. <a href="${APP_URL}/planes" style="color:#b45309">Activa tu plan</a> para no perder alertas.` : "";
    const lista = todos.slice(0, MAX_POR_CORREO);
    const asunto = `${todos.length} licitaciones nuevas para ti · ${cop.format(lista[0].precio_base ?? 0)} la mayor`;
    const r = await enviarCorreo(u.email, asunto, plantilla(u.nombre, lista, todos.length, aviso));

    await db.from("envios").insert({
      user_id: u.id, cantidad: todos.length, procesos: lista.map((p) => p.id_del_proceso),
      estado: r.ok ? "enviado" : "error", detalle: r.detalle || null,
    });
    resultados.push({ email: u.email, enviados: todos.length, ok: r.ok, detalle: r.detalle || undefined });
    await new Promise((res) => setTimeout(res, 600)); // respetar límite de Resend
  }
  return json({ ok: true, resultados });
});
