import { SubscriptionRollup } from "./subscription-rollup.js";

/** How screens and exports show a subscription rollup. */
export class SubscriptionRollupView {
  code: string;
  nameText: string;
  expiresAt: string;
  priority: string;
  campaignRef: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    expiresAt: string,
    priority: string,
    campaignRef: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.expiresAt = expiresAt;
    this.priority = priority;
    this.campaignRef = campaignRef;
    this.statusLabel = statusLabel;
  }
}

export function toSubscriptionRollupView(item: SubscriptionRollup): SubscriptionRollupView {
  return new SubscriptionRollupView(
    item.code,
    item.name,
    String(item.expiresAt),
    String(item.priority),
    item.campaignRef,
    `${item.status}`.toUpperCase(),
  );
}

export function toSubscriptionRollupViews(items: SubscriptionRollup[]): SubscriptionRollupView[] {
  const views: SubscriptionRollupView[] = [];
  for (const item of items) {
    views.push(toSubscriptionRollupView(item));
  }
  return views;
}

export function sumSubscriptionRollupView(view: SubscriptionRollupView): number {
  const parsedExpiresAt = Number(view.expiresAt);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAt} is not a number`);
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  return parsedExpiresAt + parsedPriority;
}
