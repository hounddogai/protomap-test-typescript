import { DefaultFrequencyDraft } from "./default-frequency-draft.js";

/** How screens and exports show a default frequency draft. */
export class DefaultFrequencyDraftView {
  codeText: string;
  label: string;
  sourceText: string;
  category: string;
  quantityText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    sourceText: string,
    category: string,
    quantityText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.sourceText = sourceText;
    this.category = category;
    this.quantityText = quantityText;
    this.statusLabel = statusLabel;
  }
}

export function toDefaultFrequencyDraftView(item: DefaultFrequencyDraft): DefaultFrequencyDraftView {
  return new DefaultFrequencyDraftView(
    item.code,
    item.label,
    item.source,
    item.category,
    String(item.quantity),
    `${item.status}`.toUpperCase(),
  );
}

export function toDefaultFrequencyDraftViews(items: DefaultFrequencyDraft[]): DefaultFrequencyDraftView[] {
  const views: DefaultFrequencyDraftView[] = [];
  for (const item of items) {
    views.push(toDefaultFrequencyDraftView(item));
  }
  return views;
}

export function sumDefaultFrequencyDraftView(view: DefaultFrequencyDraftView): number {
  const parsedQuantity = Number(view.quantityText);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantityText} is not a number`);
  return parsedQuantity;
}
