import * as text from "../../../../kit/text.js";
import { CreditSnapshot } from "./credit-snapshot.js";

/** How screens and exports show a credit snapshot. */
export class CreditSnapshotView {
  codeText: string;
  title: string;
  openRate: string;
  discount: string;
  conversionRate: string;
  impressions: string;
  durationMinutes: string;
  capacityText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    openRate: string,
    discount: string,
    conversionRate: string,
    impressions: string,
    durationMinutes: string,
    capacityText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.openRate = openRate;
    this.discount = discount;
    this.conversionRate = conversionRate;
    this.impressions = impressions;
    this.durationMinutes = durationMinutes;
    this.capacityText = capacityText;
    this.statusLabel = statusLabel;
  }
}

export function toCreditSnapshotView(item: CreditSnapshot): CreditSnapshotView {
  return new CreditSnapshotView(
    item.code,
    text.truncate(item.title, 40),
    item.openRate.toFixed(2),
    item.discount.toFixed(2),
    item.conversionRate.toFixed(2),
    String(item.impressions),
    String(item.durationMinutes),
    String(item.capacity),
    `${item.status}`.toUpperCase(),
  );
}

export function toCreditSnapshotViews(items: CreditSnapshot[]): CreditSnapshotView[] {
  const views: CreditSnapshotView[] = [];
  for (const item of items) {
    views.push(toCreditSnapshotView(item));
  }
  return views;
}

export function sumCreditSnapshotView(view: CreditSnapshotView): number {
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  const parsedDiscount = Number(view.discount);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discount} is not a number`);
  const parsedConversionRate = Number(view.conversionRate);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRate} is not a number`);
  return parsedOpenRate + parsedDiscount + parsedConversionRate;
}
