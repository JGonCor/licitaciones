"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { clienteNavegador } from "@/lib/supabase";
import { PLANES, cop } from "@/lib/catalogos";

export default function Planes() {
  const router = useRouter();
  const [periodo, setPeriodo] = useState<"mensual" | "anual">("anual");
  const [cargando, setCargando] = useState("");
  const [error, setError] = useState("");

  async function pagar(plan: string) {
    setError(""); setCargando(plan);
    const supabase = clienteNavegador();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.push("/entrar?siguiente=planes"); return; }
    const { data, error } = await supabase.functions.invoke("crear-pago-wompi", { body: { plan, periodo } });
    if (error || !data?.url) { setError(data?.error ?? "No pudimos iniciar el pago. Intenta de nuevo."); setCargando(""); return; }
    window.location.href = data.url;
  }

  return (
    <main className="mx-auto max-w-4xl px-5 py-16">
      <h1 className="text-3xl font-bold">Elige tu plan</h1>
      <p className="mt-2 text-slate-600">Empieza con 7 días gratis. Paga con tarjeta, PSE, Nequi o Bancolombia a través de Wompi. Tu plan se activa apenas se aprueba el pago.</p>

      <div className="mt-8 inline-flex rounded-lg border border-slate-300 bg-white p-1 text-sm">
        {(["mensual", "anual"] as const).map((p) => (
          <button key={p} onClick={() => setPeriodo(p)}
            className={`rounded-md px-4 py-1.5 font-medium ${periodo === p ? "bg-slate-900 text-white" : "text-slate-600"}`}>
            {p === "mensual" ? "Mensual" : "Anual · 2 meses gratis"}
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {PLANES.map((p) => {
          const precio = periodo === "mensual" ? p.mensual : p.anual;
          return (
            <div key={p.id} className={`tarjeta flex flex-col ${p.destacado ? "ring-2 ring-teal-500" : ""}`}>
              {p.destacado && <span className="mb-2 self-start rounded-full bg-teal-100 px-2.5 py-0.5 text-xs font-semibold text-teal-800">Más elegido</span>}
              <h2 className="text-xl font-semibold">{p.nombre}</h2>
              <p className="mt-2"><span className="text-4xl font-bold">{cop.format(precio)}</span> <span className="text-sm text-slate-500">/ {periodo === "mensual" ? "mes" : "año"}</span></p>
              {periodo === "anual" && <p className="text-sm text-teal-700">Equivale a {cop.format(Math.round(p.anual / 12))} al mes</p>}
              <ul className="mt-5 flex-1 space-y-2 text-sm text-slate-700">{p.puntos.map((x) => <li key={x}>✓ {x}</li>)}</ul>
              <button onClick={() => pagar(p.id)} disabled={!!cargando} className="btn-primario mt-6">
                {cargando === p.id ? "Abriendo pago seguro…" : `Pagar ${cop.format(precio)}`}
              </button>
            </div>
          );
        })}
      </div>
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      <p className="mt-6 text-xs text-slate-500">Pagos procesados por Wompi (Bancolombia). No guardamos datos de tu tarjeta.</p>
    </main>
  );
}
