import { redirect } from "next/navigation";
import { clienteServidor } from "@/lib/supabase";
import { cop } from "@/lib/catalogos";
import FormFiltro, { type Filtro } from "./FormFiltro";

export const dynamic = "force-dynamic";

type Proceso = {
  id_del_proceso: string; nombre: string | null; entidad: string | null; departamento: string | null;
  ciudad: string | null; precio_base: number | null; modalidad: string | null; tipo_contrato: string | null; url: string | null;
};

export default async function Panel() {
  const supabase = await clienteServidor();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");

  const { data: perfil } = await supabase.from("perfiles").select("*").eq("id", user.id).single();
  const { data: filtros } = await supabase.from("filtros").select("*").eq("user_id", user.id).order("creado_en").limit(1);
  const filtro = filtros?.[0] as Filtro | undefined;

  let vista: Proceso[] = [];
  if (filtro) {
    const desde = new Date(Date.now() - 4 * 864e5).toISOString();
    const { data } = await supabase.rpc("coincidencias_filtro", { p_filtro: filtro.id, p_desde: desde, p_limite: 25 });
    vista = (data ?? []) as Proceso[];
  }

  const ahora = Date.now();
  const enPrueba = perfil?.plan === "prueba";
  const diasPrueba = perfil ? Math.ceil((new Date(perfil.prueba_hasta).getTime() - ahora) / 864e5) : 0;
  const vencido = enPrueba ? diasPrueba <= 0 : perfil?.plan_hasta ? new Date(perfil.plan_hasta).getTime() < ahora : true;

  return (
    <main className="mx-auto max-w-6xl px-5 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Mi panel</h1>
          <p className="text-sm text-slate-600">{user.email}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${vencido ? "bg-amber-100 text-amber-800" : "bg-teal-100 text-teal-800"}`}>
            {enPrueba ? (vencido ? "Prueba terminada" : `Prueba gratis · ${diasPrueba} día${diasPrueba === 1 ? "" : "s"}`) : `Plan ${perfil?.plan}`}
          </span>
          {(enPrueba || vencido) && <a href="/planes" className="btn-acento">Activar plan</a>}
          <form action="/salir" method="post"><button className="btn-borde">Salir</button></form>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-5">
        <section className="lg:col-span-2">
          {filtro ? <FormFiltro inicial={filtro} /> : <p className="tarjeta">No encontramos tu alerta. Escríbenos.</p>}
        </section>

        <section className="lg:col-span-3">
          <div className="tarjeta">
            <h2 className="font-semibold">Vista previa: procesos abiertos de los últimos días</h2>
            <p className="mt-1 text-sm text-slate-600">Así se verá tu resumen diario con los filtros guardados. Te escribimos cada mañana a las 7:00 a.m.</p>
            {vista.length === 0 ? (
              <p className="mt-6 rounded-lg bg-slate-50 p-4 text-sm text-slate-600">No hay coincidencias recientes. Prueba con palabras clave más amplias o agrega departamentos.</p>
            ) : (
              <ul className="mt-5 space-y-3">
                {vista.map((p) => (
                  <li key={p.id_del_proceso} className="rounded-lg border border-slate-200 p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-500">{p.modalidad} · {p.tipo_contrato}</p>
                    <a href={p.url ?? "#"} target="_blank" rel="noreferrer" className="mt-1 block font-semibold leading-snug hover:text-teal-700">{p.nombre}</a>
                    <p className="text-sm text-slate-600">{p.entidad} — {[p.ciudad, p.departamento].filter(Boolean).join(", ")}</p>
                    <p className="mt-1 font-bold text-teal-700">{p.precio_base ? cop.format(p.precio_base) : "Monto no publicado"}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
