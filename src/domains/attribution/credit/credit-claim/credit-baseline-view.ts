import * as text from "../../../../kit/text.js";
import { CreditBaseline } from "./credit-baseline.js";

/** How screens and exports show a credit baseline. */
export class CreditBaselineView {
  code: string;
  label: string;
  createdAt: string;
  discount: string;
  retriesText: string;
  unitText: string;
  impressions: string;
  checksum: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    createdAt: string,
    discount: string,
    retriesText: string,
    unitText: string,
    impressions: string,
    checksum: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.createdAt = createdAt;
    this.discount = discount;
    this.retriesText = retriesText;
    this.unitText = unitText;
    this.impressions = impressions;
    this.checksum = checksum;
    this.statusLabel = statusLabel;
  }
}

export function toCreditBaselineView(item: CreditBaseline): CreditBaselineView {
  return new CreditBaselineView(
    text.truncate(item.code, 40),
    item.label,
    String(item.createdAt),
    item.discount.toFixed(2),
    String(item.retries),
    text.truncate(item.unit, 64),
    String(item.impressions),
    item.checksum,
    `${item.status}`.toUpperCase(),
  );
}

export function toCreditBaselineViews(items: CreditBaseline[]): CreditBaselineView[] {
  const views: CreditBaselineView[] = [];
  for (const item of items) {
    views.push(toCreditBaselineView(item));
  }
  return views;
}

export function sumCreditBaselineView(view: CreditBaselineView): number {
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  const parsedDiscount = Number(view.discount);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discount} is not a number`);
  const parsedRetries = Number(view.retriesText);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retriesText} is not a number`);
  return parsedCreatedAt + parsedDiscount + parsedRetries;
}
