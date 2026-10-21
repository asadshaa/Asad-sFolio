import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

/**
 * Dev-only: saves a model exported by /dev/models to assets/models/<name>.glb.
 * Disabled in production (and Vercel's filesystem is read-only anyway).
 */
export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") return new Response("Not found", { status: 404 });
  const name = new URL(request.url).searchParams.get("name") ?? "";
  if (!/^[a-z0-9-]{1,48}$/.test(name)) return Response.json({ error: "Invalid model name" }, { status: 400 });
  const data = Buffer.from(await request.arrayBuffer());
  if (data.length === 0 || data.length > 20 * 1024 * 1024) return Response.json({ error: "Invalid file size" }, { status: 400 });
  const dir = join(process.cwd(), "assets", "models");
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, `${name}.glb`), data);
  return Response.json({ saved: `assets/models/${name}.glb`, bytes: data.length });
}
