import { BufferAttribute, BufferGeometry, Mesh, type Material, type Object3D } from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

export interface MergedAsset {
  geometry: BufferGeometry;
  /** One material per geometry group (in group order). */
  materials: Material[];
}

/**
 * Bake every mesh in a loaded glTF scene into a single geometry (transforms
 * applied), with one group per source mesh so the original materials are kept.
 * Used to turn a custom .glb into something an InstancedMesh can draw.
 */
export function mergeGltfScene(root: Object3D): MergedAsset {
  root.updateMatrixWorld(true);
  const parts: BufferGeometry[] = [];
  const materials: Material[] = [];
  root.traverse((o) => {
    const mesh = o as Mesh;
    if (!mesh.isMesh) return;
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    let g = mesh.geometry.clone();
    g.applyMatrix4(mesh.matrixWorld);
    if (g.index) g = g.toNonIndexed();
    if (!g.getAttribute("normal")) g.computeVertexNormals();
    // Multi-material meshes: split by their groups.
    if (mats.length > 1 && g.groups.length) {
      for (const grp of g.groups) {
        const sub = new BufferGeometry();
        for (const [name, attr] of Object.entries(g.attributes)) {
          const arr = attr.array.slice(grp.start * attr.itemSize, (grp.start + grp.count) * attr.itemSize);
          sub.setAttribute(name, new BufferAttribute(arr, attr.itemSize, attr.normalized));
        }
        parts.push(sub);
        materials.push(mats[grp.materialIndex ?? 0] ?? mats[0]);
      }
      g.dispose();
    } else {
      parts.push(g);
      materials.push(mats[0]);
    }
  });
  if (parts.length === 0) throw new Error("The .glb contains no meshes.");

  // mergeGeometries needs identical attribute sets: keep only shared ones.
  const shared = Object.keys(parts[0].attributes).filter((n) => parts.every((p) => p.getAttribute(n)));
  for (const p of parts) {
    for (const n of Object.keys(p.attributes)) if (!shared.includes(n)) p.deleteAttribute(n);
    p.morphAttributes = {};
  }
  const geometry = mergeGeometries(parts, true);
  parts.forEach((p) => p.dispose());
  if (!geometry) throw new Error("Could not merge the meshes in the .glb.");
  geometry.computeBoundingSphere();
  return { geometry, materials };
}
