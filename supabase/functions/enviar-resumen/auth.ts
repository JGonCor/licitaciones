import { createClient, SupabaseClient } from "jsr:@supabase/supabase-js@2";

export function adminClient(): SupabaseClient {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );
}

/** Valida el header x-cron-secret contra el secreto guardado en estado_sistema. */
export async function validarCron(req: Request, db: SupabaseClient): Promise<boolean> {
  const enviado = req.headers.get("x-cron-secret");
  if (!enviado) return false;
  const { data } = await db.from("estado_sistema").select("valor").eq("clave", "cron_secret").single();
  return !!data && data.valor === enviado;
}

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
