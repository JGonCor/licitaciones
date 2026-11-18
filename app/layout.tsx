import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nexus Licitaciones — Alertas diarias de SECOP II",
  description: "Recibe cada mañana en tu correo los procesos de contratación pública de Colombia que encajan con tu empresa.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen">
        <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
            <Link href="/" className="flex items-center gap-2 font-bold tracking-tight">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-slate-900 text-sm text-teal-300">NX</span>
              Nexus <span className="font-normal text-slate-500">Licitaciones</span>
            </Link>
            <nav className="flex items-center gap-3 text-sm">
              <Link href="/planes" className="hidden text-slate-600 hover:text-slate-900 sm:inline">Planes</Link>
              <Link href="/panel" className="btn-primario">Mi panel</Link>
            </nav>
          </div>
        </header>
        {children}
        <footer className="mt-20 border-t border-slate-200 py-8 text-center text-xs text-slate-500">
          Nexus Licitaciones · Datos abiertos de SECOP II (Colombia Compra Eficiente). No somos una entidad oficial.
        </footer>
      </body>
    </html>
  );
}
