"use client";

import { useRef, useState } from "react";
import { Minus, Plus, RotateCcw, WifiOff, Wifi } from "lucide-react";

/**
 * Illustrative POS flow: cart operations, stock validation and a queued SQL
 * sync. Runs entirely in the browser with sample data — it is NOT connected
 * to, or a copy of, the real POS system.
 */

interface Item {
  sku: string;
  name: string;
  price: number;
  stock: number;
}

const CATALOG: Item[] = [
  { sku: "NB-01", name: "Notebook", price: 4.5, stock: 3 },
  { sku: "PN-02", name: "Gel pen", price: 1.2, stock: 5 },
  { sku: "MG-03", name: "Mug", price: 6.0, stock: 1 },
];

type Log = { kind: "ok" | "warn" | "sql" | "queue"; text: string };

export function PosFlowDemo() {
  const [stock, setStock] = useState<Record<string, number>>(() => Object.fromEntries(CATALOG.map((i) => [i.sku, i.stock])));
  const [cart, setCartState] = useState<Record<string, number>>({});
  // Mirror of the cart so rapid clicks always validate against the latest quantities.
  const cartRef = useRef<Record<string, number>>({});
  const setCart = (next: Record<string, number>) => {
    cartRef.current = next;
    setCartState(next);
  };
  const [online, setOnline] = useState(true);
  const [queue, setQueue] = useState<string[]>([]);
  const [log, setLog] = useState<Log[]>([{ kind: "ok", text: "Register ready (sample data)." }]);
  const [sale, setSale] = useState(1);

  const logBox = useRef<HTMLOListElement>(null);
  const push = (...l: Log[]) => {
    setLog((prev) => [...prev, ...l].slice(-14));
    requestAnimationFrame(() => logBox.current?.scrollTo({ top: logBox.current.scrollHeight }));
  };

  const add = (it: Item, delta: number) => {
    const current = cartRef.current[it.sku] ?? 0;
    const next = current + delta;
    if (next < 0) return;
    if (next > stock[it.sku]) {
      push({ kind: "warn", text: `Validation: only ${stock[it.sku]} × ${it.name} in stock — item not added.` });
      return;
    }
    setCart({ ...cartRef.current, [it.sku]: next });
  };

  const total = CATALOG.reduce((s, it) => s + (cart[it.sku] ?? 0) * it.price, 0);
  const lines = CATALOG.filter((it) => (cart[it.sku] ?? 0) > 0);

  const checkout = () => {
    if (lines.length === 0) {
      push({ kind: "warn", text: "Validation: cart is empty." });
      return;
    }
    // Re-validate against current stock before committing.
    const bad = lines.find((it) => cart[it.sku] > stock[it.sku]);
    if (bad) {
      push({ kind: "warn", text: `Validation: stock changed for ${bad.name}. Please review the cart.` });
      return;
    }
    const id = sale;
    const sql = [
      "BEGIN;",
      `INSERT INTO sales (id, total) VALUES (${id}, ${total.toFixed(2)});`,
      ...lines.map((it) => `UPDATE stock SET qty = qty - ${cart[it.sku]} WHERE sku = '${it.sku}';`),
      "COMMIT;",
    ];
    setStock(Object.fromEntries(CATALOG.map((it) => [it.sku, stock[it.sku] - (cart[it.sku] ?? 0)])));
    setCart({});
    setSale(id + 1);
    if (online) {
      push(...sql.map((t) => ({ kind: "sql" as const, text: t })), { kind: "ok", text: `Sale #${id} synced to the database.` });
    } else {
      setQueue((q) => [...q, `sale #${id}`]);
      push({ kind: "queue", text: `Offline: sale #${id} saved locally and queued for sync.` });
    }
  };

  const toggleOnline = () => {
    const next = !online;
    setOnline(next);
    if (next && queue.length) {
      push({ kind: "ok", text: `Back online: flushed ${queue.length} queued sale(s) to the database.` });
      setQueue([]);
    } else {
      push({ kind: next ? "ok" : "warn", text: next ? "Connection restored." : "Connection lost — new sales will be queued." });
    }
  };

  const reset = () => {
    setStock(Object.fromEntries(CATALOG.map((i) => [i.sku, i.stock])));
    setCart({});
    setQueue([]);
    setSale(1);
    setLog([{ kind: "ok", text: "Register reset (sample data)." }]);
  };

  return (
    <figure className="rounded-2xl border border-ink/10 bg-white/70 p-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-soft">Sample catalogue</p>
          <ul className="mt-2 space-y-2">
            {CATALOG.map((it) => (
              <li key={it.sku} className="flex items-center justify-between gap-2 rounded-xl bg-paper px-3 py-2">
                <span className="text-sm">
                  <span className="font-semibold">{it.name}</span> <span className="text-ink-soft">${it.price.toFixed(2)}</span>
                  <span className="block text-xs text-ink-soft">In stock: {stock[it.sku]}</span>
                </span>
                <span className="flex items-center gap-1">
                  <button type="button" aria-label={`Remove one ${it.name}`} onClick={() => add(it, -1)} className="grid h-7 w-7 place-items-center rounded-full bg-ink/5 hover:bg-ink/10">
                    <Minus className="h-3.5 w-3.5" aria-hidden />
                  </button>
                  <span className="w-5 text-center text-sm font-semibold tabular-nums" aria-label={`${cart[it.sku] ?? 0} in cart`}>
                    {cart[it.sku] ?? 0}
                  </span>
                  <button type="button" aria-label={`Add one ${it.name}`} onClick={() => add(it, 1)} className="grid h-7 w-7 place-items-center rounded-full bg-ink text-paper hover:bg-ink/85">
                    <Plus className="h-3.5 w-3.5" aria-hidden />
                  </button>
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button type="button" onClick={checkout} className="rounded-full bg-coral px-4 py-2 text-sm font-semibold text-white hover:bg-coral/90">
              Checkout · ${total.toFixed(2)}
            </button>
            <button type="button" onClick={toggleOnline} aria-pressed={!online} className="inline-flex items-center gap-1.5 rounded-full bg-ink/5 px-3 py-2 text-sm font-semibold hover:bg-ink/10">
              {online ? <Wifi className="h-4 w-4" aria-hidden /> : <WifiOff className="h-4 w-4" aria-hidden />}
              {online ? "Online" : `Offline · ${queue.length} queued`}
            </button>
            <button type="button" onClick={reset} aria-label="Reset demo" className="grid h-9 w-9 place-items-center rounded-full bg-ink/5 hover:bg-ink/10">
              <RotateCcw className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-soft">Event log</p>
          <ol ref={logBox} className="mt-2 max-h-56 space-y-1 overflow-y-auto rounded-xl bg-ink p-3 font-mono text-[0.72rem] leading-relaxed text-paper/90" aria-live="polite">
            {log.map((l, i) => (
              <li key={i} className={l.kind === "warn" ? "text-gold" : l.kind === "sql" ? "text-sky" : l.kind === "queue" ? "text-coral-soft" : "text-paper"}>
                {l.kind === "sql" ? "  " : "› "}
                {l.text}
              </li>
            ))}
          </ol>
        </div>
      </div>
      <figcaption className="mt-3 text-xs text-ink-soft">
        Illustrative simulation with sample data, running only in your browser. It demonstrates the ideas (cart validation, stock checks, transactional writes, queued sync) and is not the real POS.
      </figcaption>
    </figure>
  );
}
