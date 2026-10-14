import * as text from "../../../../kit/text.js";
import { StrictPayoutQuota } from "./strict-payout-quota.js";

/** How screens and exports show a strict payout quota. */
export class StrictPayoutQuotaView {
  code: string;
  title: string;
  threshold: string;
  notes: string;
  ceiling: string;
  locale: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    threshold: string,
    notes: string,
    ceiling: string,
    locale: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.threshold = threshold;
    this.notes = notes;
    this.ceiling = ceiling;
    this.locale = locale;
    this.statusLabel = statusLabel;
  }
}

export function toStrictPayoutQuotaView(item: StrictPayoutQuota): StrictPayoutQuotaView {
  return new StrictPayoutQuotaView(
    item.code,
    item.title,
    item.threshold.toFixed(2),
    text.truncate(item.notes, 80),
    item.ceiling.toFixed(2),
    item.locale,
    `${item.status}`.toUpperCase(),
  );
}

export function toStrictPayoutQuotaViews(items: StrictPayoutQuota[]): StrictPayoutQuotaView[] {
  const views: StrictPayoutQuotaView[] = [];
  for (const item of items) {
    views.push(toStrictPayoutQuotaView(item));
  }
  return views;
}

export function sumStrictPayoutQuotaView(view: StrictPayoutQuotaView): number {
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  const parsedCeiling = Number(view.ceiling);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceiling} is not a number`);
  return parsedThreshold + parsedCeiling;
}
