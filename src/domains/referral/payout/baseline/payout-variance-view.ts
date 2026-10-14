import * as text from "../../../../kit/text.js";
import { PayoutVariance } from "./payout-variance.js";

/** How screens and exports show a payout variance. */
export class PayoutVarianceView {
  codeText: string;
  title: string;
  checksum: string;
  expiresAt: string;
  threshold: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    checksum: string,
    expiresAt: string,
    threshold: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.checksum = checksum;
    this.expiresAt = expiresAt;
    this.threshold = threshold;
    this.statusLabel = statusLabel;
  }
}

export function toPayoutVarianceView(item: PayoutVariance): PayoutVarianceView {
  return new PayoutVarianceView(
    item.code,
    item.title,
    text.truncate(item.checksum, 80),
    String(item.expiresAt),
    item.threshold.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toPayoutVarianceViews(items: PayoutVariance[]): PayoutVarianceView[] {
  const views: PayoutVarianceView[] = [];
  for (const item of items) {
    views.push(toPayoutVarianceView(item));
  }
  return views;
}

export function sumPayoutVarianceView(view: PayoutVarianceView): number {
  const parsedExpiresAt = Number(view.expiresAt);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAt} is not a number`);
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  return parsedExpiresAt + parsedThreshold;
}
