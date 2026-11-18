import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const LLAVES = {
  prod: { publica: "pub_prod_3XZc7nFMw7265ba4EzYFQOkltFPpkLLh", integridad: (Deno.env.get("WOMPI_INTEGRITY_SECRET") ?? "").trim(), prefijo: "prod_integrity_", nombre: "WOMPI_INTEGRITY_SECRET" },
  prueba: { publica: (Deno.env.get("WOMPI_TEST_PUBLIC_KEY") ?? "").trim(), integridad: (Deno.env.get("WOMPI_TEST_INTEGRITY_SECRET") ?? "").trim(), prefijo: "test_integrity_", nombre: "WOMPI_TEST_INTEGRITY_SECRET" },
};
const APP_URL = Deno.env.get("APP_URL") ?? "https://licitaciones.nexuslottery.site";

// Precios en pesos (fuente de verdad del servidor)
const PRECIOS: Record<string, Record<string, number>> = {
  basico: { mensual: 39000, anual: 390000 },
  pro: { mensual: 79000, anual: 790000 },
};

const cors = {
  "Access-Control-Allow-Origin": APP_URL,
  "Access-Control-Allow-Headers": "authorization, content-type, apikey, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json" } });

async function sha256(texto: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(texto));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  const url = Deno.env.get("SUPABASE_URL")!;
  const auth = req.headers.get("Authorization") ?? "";
  const usuario = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: auth } } });
  const { data: { user } } = await usuario.auth.getUser();
  if (!user) return json({ error: "Inicia sesión para pagar" }, 401);

  const { plan, periodo, modo } = await req.json().catch(() => ({}));
  const pesos = PRECIOS[plan]?.[periodo];
  if (!pesos) return json({ error: "Plan no válido" }, 400);

  const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  // El modo prueba (sandbox de Wompi, sin cobro real) solo está permitido a administradores
  let prueba = false;
  if (modo === "prueba") {
    const { data: perfil } = await admin.from("perfiles").select("es_admin").eq("id", user.id).single();
    if (!perfil?.es_admin) return json({ error: "Modo prueba no permitido" }, 403);
    prueba = true;
  }
  const llaves = prueba ? LLAVES.prueba : LLAVES.prod;
  if (!llaves.publica || !llaves.integridad) return json({ error: "Pasarela no configurada" }, 500);
  // Validación de formato: evita cargar el secreto equivocado (eventos vs integridad, prueba vs real)
  if (!llaves.integridad.startsWith(llaves.prefijo)) {
    const actual = llaves.integridad.split("_").slice(0, 2).join("_") || "vacío";
    return json({ error: `El secreto ${llaves.nombre} debe empezar por "${llaves.prefijo}" y el cargado empieza por "${actual}_". Revísalo en Supabase.` }, 500);
  }
  if (prueba && !llaves.publica.startsWith("pub_test_")) {
    return json({ error: `WOMPI_TEST_PUBLIC_KEY debe empezar por "pub_test_".` }, 500);
  }

  const centavos = pesos * 100;
  const referencia = `${prueba ? "TEST" : "NXL"}-${plan}-${periodo}-${user.id.slice(0, 8)}-${Date.now()}`;
  const firma = await sha256(`${referencia}${centavos}COP${llaves.integridad}`);

  const { error } = await admin.from("pagos").insert({ referencia, user_id: user.id, plan, periodo, monto_centavos: centavos, prueba });
  if (error) return json({ error: error.message }, 500);

  const p = new URLSearchParams({
    "public-key": llaves.publica,
    currency: "COP",
    "amount-in-cents": String(centavos),
    reference: referencia,
    "signature:integrity": firma,
    "redirect-url": `${APP_URL}/pago`,
    "customer-data:email": user.email ?? "",
  });
  return json({ url: `https://checkout.wompi.co/p/?${p}` });
});
