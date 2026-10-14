import { PrimaryMacroSnapshot } from "./primary-macro-snapshot.js";

/** How screens and exports show a primary macro snapshot. */
export class PrimaryMacroSnapshotView {
  codeText: string;
  name: string;
  sourceText: string;
  locale: string;
  quantityText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    sourceText: string,
    locale: string,
    quantityText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.sourceText = sourceText;
    this.locale = locale;
    this.quantityText = quantityText;
    this.statusLabel = statusLabel;
  }
}

export function toPrimaryMacroSnapshotView(item: PrimaryMacroSnapshot): PrimaryMacroSnapshotView {
  return new PrimaryMacroSnapshotView(
    item.code,
    item.name,
    item.source,
    item.locale,
    String(item.quantity),
    `${item.status}`.toUpperCase(),
  );
}

export function toPrimaryMacroSnapshotViews(items: PrimaryMacroSnapshot[]): PrimaryMacroSnapshotView[] {
  const views: PrimaryMacroSnapshotView[] = [];
  for (const item of items) {
    views.push(toPrimaryMacroSnapshotView(item));
  }
  return views;
}

export function sumPrimaryMacroSnapshotView(view: PrimaryMacroSnapshotView): number {
  const parsedQuantity = Number(view.quantityText);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantityText} is not a number`);
  return parsedQuantity;
}
