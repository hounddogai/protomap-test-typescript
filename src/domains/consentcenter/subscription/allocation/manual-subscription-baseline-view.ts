import * as text from "../../../../kit/text.js";
import { ManualSubscriptionBaseline } from "./manual-subscription-baseline.js";

/** How screens and exports show a manual subscription baseline. */
export class ManualSubscriptionBaselineView {
  code: string;
  name: string;
  currency: string;
  pinnedText: string;
  campaignRef: string;
  amount: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    currency: string,
    pinnedText: string,
    campaignRef: string,
    amount: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.currency = currency;
    this.pinnedText = pinnedText;
    this.campaignRef = campaignRef;
    this.amount = amount;
    this.statusLabel = statusLabel;
  }
}

export function toManualSubscriptionBaselineView(item: ManualSubscriptionBaseline): ManualSubscriptionBaselineView {
  return new ManualSubscriptionBaselineView(
    text.truncate(item.code, 80),
    text.truncate(item.name, 80),
    item.currency,
    `${item.pinned}`,
    item.campaignRef,
    item.amount.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toManualSubscriptionBaselineViews(items: ManualSubscriptionBaseline[]): ManualSubscriptionBaselineView[] {
  const views: ManualSubscriptionBaselineView[] = [];
  for (const item of items) {
    views.push(toManualSubscriptionBaselineView(item));
  }
  return views;
}

export function sumManualSubscriptionBaselineView(view: ManualSubscriptionBaselineView): number {
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  return parsedAmount;
}
