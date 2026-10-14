import { ProofBundle } from "./proof-bundle.js";

/** How screens and exports show a proof bundle. */
export class ProofBundleView {
  code: string;
  name: string;
  segment: string;
  currency: string;
  ceiling: string;
  statusLabel: string;

  constructor(code: string, name: string, segment: string, currency: string, ceiling: string, statusLabel: string) {
    this.code = code;
    this.name = name;
    this.segment = segment;
    this.currency = currency;
    this.ceiling = ceiling;
    this.statusLabel = statusLabel;
  }
}

export function toProofBundleView(item: ProofBundle): ProofBundleView {
  return new ProofBundleView(
    item.code,
    item.name,
    item.segment,
    item.currency,
    item.ceiling.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toProofBundleViews(items: ProofBundle[]): ProofBundleView[] {
  const views: ProofBundleView[] = [];
  for (const item of items) {
    views.push(toProofBundleView(item));
  }
  return views;
}

export function sumProofBundleView(view: ProofBundleView): number {
  const parsedCeiling = Number(view.ceiling);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceiling} is not a number`);
  return parsedCeiling;
}
