"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

const TEXTOS: Record<string, { t: string; d: string; c: string }> = {
  APPROVED: { t: "¡Pago aprobado!", d: "Tu plan ya está activo. Recibirás tu primer resumen mañana a las 7:00 a.m.", c: "bg-teal-50 text-teal-800" },
  PENDING: { t: "Pago en proceso", d: "Tu banco está confirmando el pago. Activaremos tu plan apenas se apruebe; puedes cerrar esta página.", c: "bg-amber-50 text-amber-800" },
  DECLINED: { t: "Pago rechazado", d: "Tu banco no aprobó el pago. Puedes intentar con otro medio.", c: "bg-red-50 text-red-800" },
  ERROR: { t: "Hubo un error", d: "No se completó el pago. Intenta de nuevo.", c: "bg-red-50 text-red-800" },
  VOIDED: { t: "Pago anulado", d: "La transacción fue anulada.", c: "bg-red-50 text-red-800" },
};

function Resultado() {
  const id = useSearchParams().get("id");
  const [estado, setEstado] = useState<string>("CARGANDO");

  useEffect(() => {
    if (!id) { setEstado("ERROR"); return; }
    let intentos = 0;
    const consultar = async () => {
      let r = await fetch(`https://production.wompi.co/v1/transactions/${id}`).then((x) => x.json()).catch(() => null);
      if (!r?.data) r = await fetch(`https://sandbox.wompi.co/v1/transactions/${id}`).then((x) => x.json()).catch(() => null);
      const s = r?.data?.status ?? "ERROR";
      setEstado(s);
      if (s === "PENDING" && intentos++ < 10) setTimeout(consultar, 4000);
    };
    consultar();
  }, [id]);

  const info = TEXTOS[estado];
  return (
    <div className="tarjeta text-center">
      {!info ? <p className="text-slate-600">Consultando tu pago…</p> : (
        <>
          <div className={`rounded-lg p-4 ${info.c}`}><p className="text-lg font-bold">{info.t}</p><p className="mt-1 text-sm">{info.d}</p></div>
          <div className="mt-6 flex justify-center gap-3">
            <Link href="/panel" className="btn-primario">Ir a mi panel</Link>
            {estado !== "APPROVED" && estado !== "PENDING" && <Link href="/planes" className="btn-borde">Intentar de nuevo</Link>}
          </div>
        </>
      )}
    </div>
  );
}

export default function Pago() {
  return (
    <main className="mx-auto max-w-md px-5 py-20">
      <Suspense fallback={<p className="tarjeta">Consultando tu pago…</p>}><Resultado /></Suspense>
    </main>
  );
}
