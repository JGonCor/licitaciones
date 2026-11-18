"use client";
import { useState } from "react";
import { clienteNavegador } from "@/lib/supabase";

export default function Entrar() {
  const [email, setEmail] = useState("");
  const [estado, setEstado] = useState<"idle" | "enviando" | "enviado" | "error">("idle");
  const [error, setError] = useState("");

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setEstado("enviando");
    const sitio = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
    const { error } = await clienteNavegador().auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${sitio}/auth/callback` },
    });
    if (error) { setError(error.message); setEstado("error"); } else setEstado("enviado");
  }

  return (
    <main className="mx-auto max-w-md px-5 py-20">
      <div className="tarjeta">
        <h1 className="text-2xl font-bold">Entra a tu panel</h1>
        <p className="mt-1 text-sm text-slate-600">Sin contraseñas. Te enviamos un enlace de acceso a tu correo. Si es tu primera vez, empiezan tus 7 días de prueba gratis.</p>
        {estado === "enviado" ? (
          <p className="mt-6 rounded-lg bg-teal-50 p-4 text-sm text-teal-800">Listo. Revisa <b>{email}</b> y haz clic en el enlace para entrar. Si no lo ves, mira en spam.</p>
        ) : (
          <form onSubmit={enviar} className="mt-6 space-y-4">
            <div>
              <label className="etiqueta" htmlFor="email">Correo de tu empresa</label>
              <input id="email" type="email" required className="campo" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="compras@tuempresa.com" />
            </div>
            <button className="btn-primario w-full" disabled={estado === "enviando"}>
              {estado === "enviando" ? "Enviando…" : "Enviarme el enlace"}
            </button>
            {estado === "error" && <p className="text-sm text-red-600">{error}</p>}
          </form>
        )}
      </div>
    </main>
  );
}
