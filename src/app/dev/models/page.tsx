import { notFound } from "next/navigation";
import { ModelExporterRoot } from "@/components/dev/ModelExporterRoot";

export const metadata = { title: "Model exporter (dev)", robots: { index: false } };

/** Dev-only tool: exports every built-in 3D model to assets/models/*.glb. */
export default function ModelsPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <ModelExporterRoot />;
}
