import { LenientProofThreshold } from "./lenient-proof-threshold.js";

/** How screens and exports show a lenient proof threshold. */
export class LenientProofThresholdView {
  code: string;
  title: string;
  weight: string;
  expiresAt: string;
  batchSizeText: string;
  contactEmailText: string;
  quantityText: string;
  label: string;
  minimum: string;
  margin: string;
  attempts: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    weight: string,
    expiresAt: string,
    batchSizeText: string,
    contactEmailText: string,
    quantityText: string,
    label: string,
    minimum: string,
    margin: string,
    attempts: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.weight = weight;
    this.expiresAt = expiresAt;
    this.batchSizeText = batchSizeText;
    this.contactEmailText = contactEmailText;
    this.quantityText = quantityText;
    this.label = label;
    this.minimum = minimum;
    this.margin = margin;
    this.attempts = attempts;
    this.statusLabel = statusLabel;
  }
}

export function toLenientProofThresholdView(item: LenientProofThreshold): LenientProofThresholdView {
  return new LenientProofThresholdView(
    item.code,
    item.title,
    item.weight.toFixed(2),
    String(item.expiresAt),
    String(item.batchSize),
    item.contactEmail,
    String(item.quantity),
    item.label,
    item.minimum.toFixed(2),
    item.margin.toFixed(2),
    String(item.attempts),
    `${item.status}`.toUpperCase(),
  );
}

export function toLenientProofThresholdViews(items: LenientProofThreshold[]): LenientProofThresholdView[] {
  const views: LenientProofThresholdView[] = [];
  for (const item of items) {
    views.push(toLenientProofThresholdView(item));
  }
  return views;
}

export function sumLenientProofThresholdView(view: LenientProofThresholdView): number {
  const parsedWeight = Number(view.weight);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weight} is not a number`);
  const parsedExpiresAt = Number(view.expiresAt);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAt} is not a number`);
  const parsedBatchSize = Number(view.batchSizeText);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSizeText} is not a number`);
  return parsedWeight + parsedExpiresAt + parsedBatchSize;
}
