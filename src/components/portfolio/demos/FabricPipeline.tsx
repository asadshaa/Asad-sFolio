import { ArrowRight, BarChart3, Brain, ImageIcon, Tags } from "lucide-react";

const STEPS = [
  { icon: ImageIcon, title: "Image preprocessing", text: "Preparing fabric images as model input." },
  { icon: Brain, title: "Training", text: "A convolutional neural network in TensorFlow." },
  { icon: Tags, title: "Classification", text: "Predicting the fabric class of an image." },
  { icon: BarChart3, title: "Evaluation", text: "Measuring how well the model performs." },
];

/**
 * Pipeline overview for Fabric Classification, built only from the listed
 * focus areas. Example images and results appear only when real, verified
 * media is added to the project config.
 */
export function FabricPipeline({ hasMedia }: { hasMedia: boolean }) {
  return (
    <figure className="rounded-2xl border border-ink/10 bg-white/70 p-4">
      <ol className="grid gap-2 sm:grid-cols-4">
        {STEPS.map((s, i) => (
          <li key={s.title} className="relative rounded-xl bg-paper p-3">
            <s.icon className="h-5 w-5 text-coral" aria-hidden />
            <p className="mt-2 text-sm font-semibold">{s.title}</p>
            <p className="text-xs text-ink-soft">{s.text}</p>
            {i < STEPS.length - 1 && <ArrowRight className="absolute -right-2.5 top-1/2 hidden h-4 w-4 -translate-y-1/2 text-ink/30 sm:block" aria-hidden />}
          </li>
        ))}
      </ol>
      {!hasMedia && (
        <p className="mt-3 rounded-xl border border-dashed border-ink/20 px-3 py-2 text-xs text-ink-soft">
          Example input images and verified predictions / training results will appear here once they are added to this project&apos;s
          media. No sample predictions are shown until then.
        </p>
      )}
      <figcaption className="mt-2 text-xs text-ink-soft">Pipeline overview based on the project&apos;s focus areas.</figcaption>
    </figure>
  );
}
