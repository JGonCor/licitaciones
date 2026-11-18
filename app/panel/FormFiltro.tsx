"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { clienteNavegador } from "@/lib/supabase";
import { DEPARTAMENTOS, TIPOS_CONTRATO } from "@/lib/catalogos";

export type Filtro = {
  id: string; nombre: string; palabras_clave: string[]; palabras_excluidas: string[]; departamentos: string[];
  tipos_contrato: string[]; monto_min: number | null; monto_max: number | null; excluir_directa: boolean; activo: boolean;
};

const aLista = (s: string) => s.split(",").map((x) => x.trim()).filter(Boolean);

function Chips({ opciones, valor, onChange }: { opciones: string[]; valor: string[]; onChange: (v: string[]) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {opciones.map((o) => {
        const activo = valor.includes(o);
        return (
          <button type="button" key={o} onClick={() => onChange(activo ? valor.filter((x) => x !== o) : [...valor, o])}
            className={`rounded-full border px-3 py-1 text-xs transition ${activo ? "border-teal-600 bg-teal-50 text-teal-800" : "border-slate-300 bg-white text-slate-600 hover:border-slate-400"}`}>
            {o}
          </button>
        );
      })}
    </div>
  );
}

export default function FormFiltro({ inicial }: { inicial: Filtro }) {
  const router = useRouter();
  const [palabras, setPalabras] = useState(inicial.palabras_clave.join(", "));
  const [excluidas, setExcluidas] = useState(inicial.palabras_excluidas.join(", "));
  const [deptos, setDeptos] = useState(inicial.departamentos);
  const [tipos, setTipos] = useState(inicial.tipos_contrato);
  const [min, setMin] = useState(inicial.monto_min?.toString() ?? "");
  const [max, setMax] = useState(inicial.monto_max?.toString() ?? "");
  const [directa, setDirecta] = useState(inicial.excluir_directa);
  const [activo, setActivo] = useState(inicial.activo);
  const [msg, setMsg] = useState("");
  const [guardando, setGuardando] = useState(false);

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setGuardando(true); setMsg("");
    const { error } = await clienteNavegador().from("filtros").update({
      palabras_clave: aLista(palabras), palabras_excluidas: aLista(excluidas), departamentos: deptos, tipos_contrato: tipos,
      monto_min: min ? Number(min.replace(/\D/g, "")) : null, monto_max: max ? Number(max.replace(/\D/g, "")) : null,
      excluir_directa: directa, activo, actualizado_en: new Date().toISOString(),
    }).eq("id", inicial.id);
    setGuardando(false);
    setMsg(error ? `Error: ${error.message}` : "Guardado. La vista previa se actualizó.");
    if (!error) router.refresh();
  }

  return (
    <form onSubmit={guardar} className="tarjeta space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Mi alerta</h2>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={activo} onChange={(e) => setActivo(e.target.checked)} /> Activa
        </label>
      </div>
      <div>
        <label className="etiqueta">Palabras clave <span className="font-normal text-slate-500">(separadas por coma)</span></label>
        <input className="campo" value={palabras} onChange={(e) => setPalabras(e.target.value)} placeholder="dotación, aseo, software, mantenimiento" />
        <p className="mt-1 text-xs text-slate-500">Vacío = todos los procesos. No importan tildes ni mayúsculas.</p>
      </div>
      <div>
        <label className="etiqueta">Excluir si contiene</label>
        <input className="campo" value={excluidas} onChange={(e) => setExcluidas(e.target.value)} placeholder="arrendamiento, persona natural" />
      </div>
      <div>
        <label className="etiqueta">Departamentos <span className="font-normal text-slate-500">(ninguno = todo el país)</span></label>
        <Chips opciones={DEPARTAMENTOS} valor={deptos} onChange={setDeptos} />
      </div>
      <div>
        <label className="etiqueta">Tipo de contrato</label>
        <Chips opciones={TIPOS_CONTRATO} valor={tipos} onChange={setTipos} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="etiqueta">Monto mínimo (COP)</label><input className="campo" inputMode="numeric" value={min} onChange={(e) => setMin(e.target.value)} placeholder="10000000" /></div>
        <div><label className="etiqueta">Monto máximo (COP)</label><input className="campo" inputMode="numeric" value={max} onChange={(e) => setMax(e.target.value)} placeholder="Sin límite" /></div>
      </div>
      <label className="flex items-start gap-2 text-sm text-slate-700">
        <input type="checkbox" className="mt-1" checked={directa} onChange={(e) => setDirecta(e.target.checked)} />
        Ocultar contratación directa (procesos donde la entidad ya eligió al contratista)
      </label>
      <button className="btn-primario w-full" disabled={guardando}>{guardando ? "Guardando…" : "Guardar alerta"}</button>
      {msg && <p className="text-sm text-slate-600">{msg}</p>}
    </form>
  );
}
