import type { Metadata } from "next";
import { AulaList } from "@/components/AulaList";

export const metadata: Metadata = {
  title: "Aula virtual",
  description: "Pruebas y simulacros cortos para aprender a reconocer fraudes por mensaje.",
};

export default function AulaPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-bold">Aula virtual</h1>
      <p className="mt-2 max-w-2xl text-muted">
        Practica sin registrarte. No pedimos tu nombre ni tu número: tus respuestas se guardan con
        un código anónimo para medir cuánto ayuda el proyecto.
      </p>
      <div className="mt-8">
        <AulaList />
      </div>
    </div>
  );
}
