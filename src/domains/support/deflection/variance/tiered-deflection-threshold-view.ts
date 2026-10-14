import { TieredDeflectionThreshold } from "./tiered-deflection-threshold.js";

/** How screens and exports show a tiered deflection threshold. */
export class TieredDeflectionThresholdView {
  code: string;
  label: string;
  quantityText: string;
  approved: string;
  locale: string;
  externalRefText: string;
  journeyId: string;
  active: string;
  score: string;
  endsAtText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    quantityText: string,
    approved: string,
    locale: string,
    externalRefText: string,
    journeyId: string,
    active: string,
    score: string,
    endsAtText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.quantityText = quantityText;
    this.approved = approved;
    this.locale = locale;
    this.externalRefText = externalRefText;
    this.journeyId = journeyId;
    this.active = active;
    this.score = score;
    this.endsAtText = endsAtText;
    this.statusLabel = statusLabel;
  }
}

export function toTieredDeflectionThresholdView(item: TieredDeflectionThreshold): TieredDeflectionThresholdView {
  return new TieredDeflectionThresholdView(
    item.code,
    item.label,
    String(item.quantity),
    `${item.approved}`,
    item.locale,
    item.externalRef,
    item.journeyId,
    `${item.active}`,
    item.score.toFixed(2),
    String(item.endsAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toTieredDeflectionThresholdViews(items: TieredDeflectionThreshold[]): TieredDeflectionThresholdView[] {
  const views: TieredDeflectionThresholdView[] = [];
  for (const item of items) {
    views.push(toTieredDeflectionThresholdView(item));
  }
  return views;
}

export function sumTieredDeflectionThresholdView(view: TieredDeflectionThresholdView): number {
  const parsedQuantity = Number(view.quantityText);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantityText} is not a number`);
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  const parsedEndsAt = Number(view.endsAtText);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAtText} is not a number`);
  return parsedQuantity + parsedScore + parsedEndsAt;
}
