"use client";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { clienteNavegador } from "@/lib/supabase";

function Formulario() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [codigo, setCodigo] = useState("");
  const [paso, setPaso] = useState<"correo" | "codigo">("correo");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(params.get("error") === "enlace" ? "Ese enlace ya no es válido. Pide un código nuevo y usa siempre el correo más reciente." : "");

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setCargando(true); setError("");
    const sitio = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
    const { error } = await clienteNavegador().auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { emailRedirectTo: `${sitio}/auth/callback` },
    });
    setCargando(false);
    if (error) {
      setError(error.status === 429 ? "Ya te enviamos un código hace un momento. Espera un minuto antes de pedir otro." : error.message);
      return;
    }
    setPaso("codigo");
  }

  async function verificar(e: React.FormEvent) {
    e.preventDefault();
    setCargando(true); setError("");
    const { error } = await clienteNavegador().auth.verifyOtp({ email: email.trim().toLowerCase(), token: codigo.trim(), type: "email" });
    setCargando(false);
    if (error) { setError("El código no es válido o ya venció. Revisa que sea el del correo más reciente."); return; }
    const siguiente = params.get("siguiente");
    router.push(siguiente === "planes" ? "/planes" : "/panel");
    router.refresh();
  }

  return (
    <div className="tarjeta">
      <h1 className="text-2xl font-bold">Entra a tu panel</h1>
      {paso === "correo" ? (
        <>
          <p className="mt-1 text-sm text-slate-600">Sin contraseñas. Te enviamos un código de acceso a tu correo. Si es tu primera vez, empiezan tus 7 días de prueba gratis.</p>
          <form onSubmit={enviar} className="mt-6 space-y-4">
            <div>
              <label className="etiqueta" htmlFor="email">Correo de tu empresa</label>
              <input id="email" type="email" required className="campo" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="compras@tuempresa.com" />
            </div>
            <button className="btn-primario w-full" disabled={cargando}>{cargando ? "Enviando…" : "Enviarme el código"}</button>
          </form>
        </>
      ) : (
        <>
          <p className="mt-1 text-sm text-slate-600">Enviamos un código a <b>{email}</b>. Escríbelo aquí (si no lo ves, revisa spam).</p>
          <form onSubmit={verificar} className="mt-6 space-y-4">
            <div>
              <label className="etiqueta" htmlFor="codigo">Código de acceso</label>
              <input id="codigo" inputMode="numeric" autoComplete="one-time-code" required className="campo text-center text-2xl tracking-[0.4em]"
                value={codigo} onChange={(e) => setCodigo(e.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="••••••" />
            </div>
            <button className="btn-primario w-full" disabled={cargando || codigo.length < 6}>{cargando ? "Verificando…" : "Entrar"}</button>
            <button type="button" onClick={() => { setPaso("correo"); setCodigo(""); setError(""); }} className="w-full text-sm text-slate-500 hover:text-slate-800">
              Usar otro correo o pedir un código nuevo
            </button>
          </form>
        </>
      )}
      {error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    </div>
  );
}

export default function Entrar() {
  return (
    <main className="mx-auto max-w-md px-5 py-20">
      <Suspense fallback={<div className="tarjeta">Cargando…</div>}><Formulario /></Suspense>
    </main>
  );
}
