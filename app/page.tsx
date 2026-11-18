import Link from "next/link";
import { PLANES, cop } from "@/lib/catalogos";

const pasos = [
  { t: "Configura tus filtros", d: "Elige palabras clave, departamentos, tipo de contrato y rango de montos en dos minutos." },
  { t: "Revisamos SECOP II por ti", d: "Cada pocas horas leemos los procesos nuevos publicados por entidades de todo el país." },
  { t: "Recibe tu resumen a las 7 a.m.", d: "Solo los procesos abiertos que encajan contigo, ordenados por monto y con enlace directo." },
];

const ventajas = [
  ["+800", "procesos abiertos nuevos por día en SECOP II"],
  ["7 días", "de prueba gratis, sin tarjeta"],
  ["0 horas", "revisando el portal a mano"],
];

export default function Inicio() {
  return (
    <main>
      <section className="bg-slate-900 text-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-20 md:grid-cols-2 md:items-center">
          <div>
            <p className="mb-4 inline-block rounded-full bg-teal-400/10 px-3 py-1 text-xs font-semibold tracking-wider text-teal-300">ALERTAS DE CONTRATACIÓN PÚBLICA · COLOMBIA</p>
            <h1 className="text-4xl font-bold leading-tight md:text-5xl">Las licitaciones que tu empresa puede ganar, cada mañana en tu correo.</h1>
            <p className="mt-5 text-lg text-slate-300">Nexus Licitaciones filtra SECOP II por tu sector, región y presupuesto. Deja de buscar y dedica tu tiempo a preparar ofertas.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/entrar" className="btn-acento">Probar 7 días gratis</Link>
              <Link href="/planes" className="btn border border-slate-600 text-white hover:bg-slate-800">Ver planes</Link>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-700 bg-slate-800/60 p-5 shadow-2xl">
            <p className="text-xs font-semibold tracking-wider text-teal-300">NEXUS LICITACIONES · RESUMEN DIARIO</p>
            <p className="mt-1 text-xl font-bold">12 oportunidades nuevas para ti</p>
            {[
              ["Suministro de dotación y elementos de protección", "Alcaldía · Cundinamarca", "$184.500.000"],
              ["Mantenimiento de equipos de cómputo", "Hospital · Boyacá", "$62.300.000"],
              ["Servicio de aseo y cafetería", "Institución Educativa · Bogotá", "$41.900.000"],
            ].map(([n, e, m]) => (
              <div key={n} className="mt-3 rounded-lg bg-white p-4 text-slate-900">
                <p className="font-semibold leading-snug">{n}</p>
                <p className="text-sm text-slate-500">{e}</p>
                <p className="mt-2 font-bold text-teal-700">{m}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 px-5 py-14 sm:grid-cols-3">
        {ventajas.map(([n, t]) => (
          <div key={t} className="tarjeta text-center">
            <p className="text-3xl font-bold text-teal-700">{n}</p>
            <p className="mt-1 text-sm text-slate-600">{t}</p>
          </div>
        ))}
      </section>

      <section className="mx-auto max-w-6xl px-5 py-6">
        <h2 className="text-2xl font-bold">Cómo funciona</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {pasos.map((p, i) => (
            <div key={p.t} className="tarjeta">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-slate-900 text-sm font-bold text-teal-300">{i + 1}</span>
              <h3 className="mt-4 font-semibold">{p.t}</h3>
              <p className="mt-1 text-sm text-slate-600">{p.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-14">
        <h2 className="text-2xl font-bold">Planes</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {PLANES.map((p) => (
            <div key={p.id} className={`tarjeta ${p.destacado ? "ring-2 ring-teal-500" : ""}`}>
              <h3 className="text-lg font-semibold">{p.nombre}</h3>
              <p className="mt-2"><span className="text-3xl font-bold">{cop.format(p.mensual)}</span> <span className="text-sm text-slate-500">/ mes</span></p>
              <ul className="mt-4 space-y-2 text-sm text-slate-700">{p.puntos.map((x) => <li key={x}>✓ {x}</li>)}</ul>
            </div>
          ))}
        </div>
        <div className="mt-8 text-center"><Link href="/entrar" className="btn-primario">Empieza tu prueba gratis</Link></div>
      </section>
    </main>
  );
}
