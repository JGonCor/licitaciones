import Link from "next/link";
import { PLANES } from "@/lib/catalogos";

export default function Planes() {
  return (
    <main className="mx-auto max-w-4xl px-5 py-16">
      <h1 className="text-3xl font-bold">Elige tu plan</h1>
      <p className="mt-2 text-slate-600">Empieza con 7 días gratis. Al pagar, usa el mismo correo con el que te registraste para activar tu plan automáticamente.</p>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {PLANES.map((p) => (
          <div key={p.id} className={`tarjeta flex flex-col ${p.destacado ? "ring-2 ring-teal-500" : ""}`}>
            {p.destacado && <span className="mb-2 self-start rounded-full bg-teal-100 px-2.5 py-0.5 text-xs font-semibold text-teal-800">Más elegido</span>}
            <h2 className="text-xl font-semibold">{p.nombre}</h2>
            <p className="mt-2"><span className="text-4xl font-bold">{p.precio}</span> <span className="text-sm text-slate-500">{p.periodo}</span></p>
            <ul className="mt-5 flex-1 space-y-2 text-sm text-slate-700">{p.puntos.map((x) => <li key={x}>✓ {x}</li>)}</ul>
            {p.link ? (
              <a href={p.link} className="btn-primario mt-6">Suscribirme</a>
            ) : (
              <Link href="/entrar" className="btn-primario mt-6">Empezar prueba gratis</Link>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}
