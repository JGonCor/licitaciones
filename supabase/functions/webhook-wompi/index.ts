import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const EVENTS = Deno.env.get("WOMPI_EVENTS_SECRET") ?? "";

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
  if (!evento?.signature || !EVENTS) return new Response("sin firma", { status: 400 });

  // Verificar checksum: valores de signature.properties + timestamp + secreto de eventos
  const props: string[] = evento.signature.properties ?? [];
  const cadena = props.map((p) => valor(evento.data, p)).join("") + evento.timestamp + EVENTS;
  if ((await sha256(cadena)).toUpperCase() !== String(evento.signature.checksum).toUpperCase()) {
    return new Response("firma inválida", { status: 401 });
  }

  const t = evento.data?.transaction;
  if (evento.event !== "transaction.updated" || !t?.reference) return new Response("ignorado");

  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: pago } = await db.from("pagos").select("monto_centavos").eq("referencia", t.reference).single();
  if (!pago) return new Response("referencia desconocida");

  if (t.status === "APPROVED" && Number(t.amount_in_cents) === Number(pago.monto_centavos)) {
    await db.rpc("activar_pago", { p_referencia: t.reference, p_wompi_id: t.id, p_metodo: t.payment_method_type ?? null });
  } else {
    await db.from("pagos").update({ estado: t.status, wompi_id: t.id, metodo: t.payment_method_type ?? null, actualizado_en: new Date().toISOString() })
      .eq("referencia", t.reference).neq("estado", "APPROVED");
  }
  return new Response("ok");
});
