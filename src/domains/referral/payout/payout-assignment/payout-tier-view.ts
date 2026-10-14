import * as text from "../../../../kit/text.js";
import { PayoutTier } from "./payout-tier.js";

/** How screens and exports show a payout tier. */
export class PayoutTierView {
  code: string;
  label: string;
  batchSize: string;
  name: string;
  expiresAt: string;
  ratio: string;
  capacityText: string;
  locale: string;
  updatedAt: string;
  campaignRef: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    batchSize: string,
    name: string,
    expiresAt: string,
    ratio: string,
    capacityText: string,
    locale: string,
    updatedAt: string,
    campaignRef: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.batchSize = batchSize;
    this.name = name;
    this.expiresAt = expiresAt;
    this.ratio = ratio;
    this.capacityText = capacityText;
    this.locale = locale;
    this.updatedAt = updatedAt;
    this.campaignRef = campaignRef;
    this.statusLabel = statusLabel;
  }
}

export function toPayoutTierView(item: PayoutTier): PayoutTierView {
  return new PayoutTierView(
    item.code,
    item.label,
    String(item.batchSize),
    item.name,
    String(item.expiresAt),
    item.ratio.toFixed(2),
    String(item.capacity),
    item.locale,
    String(item.updatedAt),
    text.truncate(item.campaignRef, 80),
    `${item.status}`.toUpperCase(),
  );
}

export function toPayoutTierViews(items: PayoutTier[]): PayoutTierView[] {
  const views: PayoutTierView[] = [];
  for (const item of items) {
    views.push(toPayoutTierView(item));
  }
  return views;
}

export function sumPayoutTierView(view: PayoutTierView): number {
  const parsedBatchSize = Number(view.batchSize);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSize} is not a number`);
  const parsedExpiresAt = Number(view.expiresAt);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAt} is not a number`);
  const parsedRatio = Number(view.ratio);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratio} is not a number`);
  return parsedBatchSize + parsedExpiresAt + parsedRatio;
}
