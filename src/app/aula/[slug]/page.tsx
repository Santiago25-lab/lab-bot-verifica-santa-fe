import { Suspense } from "react";
import { QuizRunner } from "@/components/QuizRunner";

export default function QuizPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <Suspense fallback={<p className="text-muted">Cargando…</p>}>
        <QuizRunner />
      </Suspense>
    </div>
  );
}
