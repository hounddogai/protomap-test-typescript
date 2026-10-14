import { DoubleOptInDraft } from "./double-opt-in-draft.js";

/** How screens and exports show a double opt in draft. */
export class DoubleOptInDraftView {
  code: string;
  label: string;
  ratio: string;
  discountText: string;
  batchSizeText: string;
  score: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    ratio: string,
    discountText: string,
    batchSizeText: string,
    score: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.ratio = ratio;
    this.discountText = discountText;
    this.batchSizeText = batchSizeText;
    this.score = score;
    this.statusLabel = statusLabel;
  }
}

export function toDoubleOptInDraftView(item: DoubleOptInDraft): DoubleOptInDraftView {
  return new DoubleOptInDraftView(
    item.code,
    item.label,
    item.ratio.toFixed(2),
    item.discount.toFixed(2),
    String(item.batchSize),
    item.score.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toDoubleOptInDraftViews(items: DoubleOptInDraft[]): DoubleOptInDraftView[] {
  const views: DoubleOptInDraftView[] = [];
  for (const item of items) {
    views.push(toDoubleOptInDraftView(item));
  }
  return views;
}

export function sumDoubleOptInDraftView(view: DoubleOptInDraftView): number {
  const parsedRatio = Number(view.ratio);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratio} is not a number`);
  const parsedDiscount = Number(view.discountText);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discountText} is not a number`);
  const parsedBatchSize = Number(view.batchSizeText);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSizeText} is not a number`);
  return parsedRatio + parsedDiscount + parsedBatchSize;
}
