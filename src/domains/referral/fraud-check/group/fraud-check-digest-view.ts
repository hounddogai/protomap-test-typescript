import * as text from "../../../../kit/text.js";
import { FraudCheckDigest } from "./fraud-check-digest.js";

/** How screens and exports show a fraud check digest. */
export class FraudCheckDigestView {
  code: string;
  name: string;
  reviewer: string;
  summary: string;
  weight: string;
  variant: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    reviewer: string,
    summary: string,
    weight: string,
    variant: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.reviewer = reviewer;
    this.summary = summary;
    this.weight = weight;
    this.variant = variant;
    this.statusLabel = statusLabel;
  }
}

export function toFraudCheckDigestView(item: FraudCheckDigest): FraudCheckDigestView {
  return new FraudCheckDigestView(
    item.code,
    item.name,
    item.reviewer,
    item.summary,
    item.weight.toFixed(2),
    text.truncate(item.variant, 40),
    `${item.status}`.toUpperCase(),
  );
}

export function toFraudCheckDigestViews(items: FraudCheckDigest[]): FraudCheckDigestView[] {
  const views: FraudCheckDigestView[] = [];
  for (const item of items) {
    views.push(toFraudCheckDigestView(item));
  }
  return views;
}

export function sumFraudCheckDigestView(view: FraudCheckDigestView): number {
  const parsedWeight = Number(view.weight);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weight} is not a number`);
  return parsedWeight;
}
