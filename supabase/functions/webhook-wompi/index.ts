import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const SECRETOS: Record<string, string> = {
  prod: (Deno.env.get("WOMPI_EVENTS_SECRET") ?? "").trim(),
  test: (Deno.env.get("WOMPI_TEST_EVENTS_SECRET") ?? "").trim(),
};

async function sha256(texto: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(texto));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Lee "transaction.id" dentro de data
function valor(obj: Record<string, unknown>, ruta: string): string {
  return String(ruta.split(".").reduce<unknown>((o, k) => (o as Record<string, unknown>)?.[k], obj) ?? "");
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("ok");
  const evento = await req.json().catch(() => null);
  const ambiente = evento?.environment === "test" ? "test" : "prod";
  const EVENTS = SECRETOS[ambiente];
  if (!evento?.signature || !EVENTS) return new Response("sin firma", { status: 400 });

  // Verificar checksum: valores de signature.properties + timestamp + secreto de eventos
  const props: string[] = evento.signature.properties ?? [];
  const cadena = props.map((p) => valor(evento.data, p)).join("") + evento.timestamp + EVENTS;
  const recibido = String(evento.signature.checksum).toUpperCase();
  if ((await sha256(cadena)).toUpperCase() !== recibido) {
    // Diagnóstico sin exponer secretos: ¿coincide con el secreto de integridad (secretos intercambiados)?
    const integ = ((ambiente === "test" ? Deno.env.get("WOMPI_TEST_INTEGRITY_SECRET") : Deno.env.get("WOMPI_INTEGRITY_SECRET")) ?? "").trim();
    const base = props.map((p) => valor(evento.data, p)).join("") + evento.timestamp;
    const intercambiado = integ && (await sha256(base + integ)).toUpperCase() === recibido;
    console.error(JSON.stringify({ firma: "invalida", ambiente, props, largo_secreto: EVENTS.length, prefijo: EVENTS.slice(0, 9), intercambiado }));
    return new Response("firma inválida", { status: 401 });
  }

  const t = evento.data?.transaction;
  if (evento.event !== "transaction.updated" || !t?.reference) return new Response("ignorado");

  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: pago } = await db.from("pagos").select("monto_centavos,prueba").eq("referencia", t.reference).single();
  if (!pago) return new Response("referencia desconocida");
  // Un evento del sandbox solo puede activar pagos marcados como prueba, y viceversa
  if (pago.prueba !== (ambiente === "test")) return new Response("ambiente no coincide", { status: 400 });

  if (t.status === "APPROVED" && Number(t.amount_in_cents) === Number(pago.monto_centavos)) {
    await db.rpc("activar_pago", { p_referencia: t.reference, p_wompi_id: t.id, p_metodo: t.payment_method_type ?? null });
  } else {
    await db.from("pagos").update({ estado: t.status, wompi_id: t.id, metodo: t.payment_method_type ?? null, actualizado_en: new Date().toISOString() })
      .eq("referencia", t.reference).neq("estado", "APPROVED");
  }
  return new Response("ok");
});
