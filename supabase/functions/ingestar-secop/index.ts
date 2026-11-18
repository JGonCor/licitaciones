import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { adminClient, json, validarCron } from "./auth.ts";

const DATASET = "https://www.datos.gov.co/resource/p6dx-8zbt.json";
const LOTE = 1000;
const MAX_LOTES = 15;

type Fila = Record<string, unknown>;

function aFechaSoda(valor: string): string {
  // Acepta "2026-11-13 10:00:00+00" o "2026-11-13T10:00:00.000" y devuelve "2026-11-13T10:00:00.000"
  const limpio = valor.replace(" ", "T");
  return limpio.length >= 23 ? limpio.slice(0, 23) : limpio.slice(0, 19);
}

function texto(v: unknown): string | null {
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  return s === "" || s === "No Definido" || s === "No definido" ? null : s;
}

function mapear(f: Fila) {
  const url = typeof f.urlproceso === "object" && f.urlproceso
    ? (f.urlproceso as { url?: string }).url ?? null
    : texto(f.urlproceso);
  const precio = Number(f.precio_base);
  return {
    id_del_proceso: String(f.id_del_proceso),
    entidad: texto(f.entidad),
    nit_entidad: texto(f.nit_entidad),
    departamento: texto(f.departamento_entidad),
    ciudad: texto(f.ciudad_entidad),
    nombre: texto(f.nombre_del_procedimiento),
    descripcion: texto(f.descripci_n_del_procedimiento),
    fase: texto(f.fase),
    estado: texto(f.estado_del_procedimiento),
    estado_resumen: texto(f.estado_resumen),
    modalidad: texto(f.modalidad_de_contratacion),
    tipo_contrato: texto(f.tipo_de_contrato),
    precio_base: Number.isFinite(precio) ? precio : null,
    duracion: f.duracion ? `${f.duracion} ${f.unidad_de_duracion ?? ""}`.trim() : null,
    categoria: texto(f.codigo_principal_de_categoria),
    // SECOP publica en hora de Colombia sin zona
    fecha_publicacion: f.fecha_de_publicacion_del ? `${String(f.fecha_de_publicacion_del)}-05:00` : null,
    url,
  };
}

Deno.serve(async (req) => {
  const db = adminClient();
  if (!(await validarCron(req, db))) return json({ error: "no autorizado" }, 401);

  const { data: marca } = await db.from("estado_sistema").select("valor").eq("clave", "ultima_fecha_ingesta").single();
  const desde = aFechaSoda(marca?.valor ?? new Date(Date.now() - 3 * 864e5).toISOString());
  let maxFecha = desde;
  let total = 0;

  for (let i = 0; i < MAX_LOTES; i++) {
    const params = new URLSearchParams({
      "$where": `fecha_de_publicacion_del > '${desde}'`,
      "$order": "fecha_de_publicacion_del ASC, id_del_proceso ASC",
      "$limit": String(LOTE),
      "$offset": String(i * LOTE),
    });
    const resp = await fetch(`${DATASET}?${params}`, { headers: { Accept: "application/json" } });
    if (!resp.ok) return json({ error: `SECOP respondió ${resp.status}`, detalle: await resp.text(), total }, 502);
    const filas = (await resp.json()) as Fila[];
    if (filas.length === 0) break;

    const vistos = new Map<string, ReturnType<typeof mapear>>();
    for (const f of filas) if (f.id_del_proceso) vistos.set(String(f.id_del_proceso), mapear(f));
    const registros = [...vistos.values()];
    const { error } = await db.from("procesos").upsert(registros, { onConflict: "id_del_proceso" });
    if (error) return json({ error: error.message, total }, 500);

    total += registros.length;
    const ultima = String(filas[filas.length - 1].fecha_de_publicacion_del ?? "");
    if (ultima > maxFecha) maxFecha = ultima;
    if (filas.length < LOTE) break;
  }

  if (maxFecha !== desde) {
    await db.from("estado_sistema").update({ valor: maxFecha, actualizado_en: new Date().toISOString() })
      .eq("clave", "ultima_fecha_ingesta");
  }
  return json({ ok: true, procesos: total, desde, marca: maxFecha });
});
