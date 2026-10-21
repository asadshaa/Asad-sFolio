"use client";

import dynamic from "next/dynamic";

const ModelExporter = dynamic(() => import("./ModelExporter"), { ssr: false, loading: () => <p className="p-8">Loading exporter…</p> });

export function ModelExporterRoot() {
  return <ModelExporter />;
}
