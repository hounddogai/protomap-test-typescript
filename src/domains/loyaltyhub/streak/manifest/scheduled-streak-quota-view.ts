import * as text from "../../../../kit/text.js";
import { ScheduledStreakQuota } from "./scheduled-streak-quota.js";

/** How screens and exports show a scheduled streak quota. */
export class ScheduledStreakQuotaView {
  codeText: string;
  title: string;
  discount: string;
  campaignRef: string;
  statusLabel: string;

  constructor(codeText: string, title: string, discount: string, campaignRef: string, statusLabel: string) {
    this.codeText = codeText;
    this.title = title;
    this.discount = discount;
    this.campaignRef = campaignRef;
    this.statusLabel = statusLabel;
  }
}

export function toScheduledStreakQuotaView(item: ScheduledStreakQuota): ScheduledStreakQuotaView {
  return new ScheduledStreakQuotaView(
    text.truncate(item.code, 40),
    item.title,
    item.discount.toFixed(2),
    text.truncate(item.campaignRef, 120),
    `${item.status}`.toUpperCase(),
  );
}

export function toScheduledStreakQuotaViews(items: ScheduledStreakQuota[]): ScheduledStreakQuotaView[] {
  const views: ScheduledStreakQuotaView[] = [];
  for (const item of items) {
    views.push(toScheduledStreakQuotaView(item));
  }
  return views;
}

export function sumScheduledStreakQuotaView(view: ScheduledStreakQuotaView): number {
  const parsedDiscount = Number(view.discount);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discount} is not a number`);
  return parsedDiscount;
}
