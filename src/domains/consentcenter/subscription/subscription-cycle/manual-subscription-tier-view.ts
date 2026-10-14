import * as text from "../../../../kit/text.js";
import { ManualSubscriptionTier } from "./manual-subscription-tier.js";

/** How screens and exports show a manual subscription tier. */
export class ManualSubscriptionTierView {
  codeText: string;
  label: string;
  windowDaysText: string;
  unit: string;
  ceiling: string;
  endsAt: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    windowDaysText: string,
    unit: string,
    ceiling: string,
    endsAt: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.windowDaysText = windowDaysText;
    this.unit = unit;
    this.ceiling = ceiling;
    this.endsAt = endsAt;
    this.statusLabel = statusLabel;
  }
}

export function toManualSubscriptionTierView(item: ManualSubscriptionTier): ManualSubscriptionTierView {
  return new ManualSubscriptionTierView(
    text.truncate(item.code, 40),
    item.label,
    String(item.windowDays),
    text.truncate(item.unit, 80),
    item.ceiling.toFixed(2),
    String(item.endsAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toManualSubscriptionTierViews(items: ManualSubscriptionTier[]): ManualSubscriptionTierView[] {
  const views: ManualSubscriptionTierView[] = [];
  for (const item of items) {
    views.push(toManualSubscriptionTierView(item));
  }
  return views;
}

export function sumManualSubscriptionTierView(view: ManualSubscriptionTierView): number {
  const parsedWindowDays = Number(view.windowDaysText);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDaysText} is not a number`);
  const parsedCeiling = Number(view.ceiling);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceiling} is not a number`);
  const parsedEndsAt = Number(view.endsAt);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAt} is not a number`);
  return parsedWindowDays + parsedCeiling + parsedEndsAt;
}
