import * as text from "../../../../kit/text.js";
import { SubscriptionQuota } from "./subscription-quota.js";

/** How screens and exports show a subscription quota. */
export class SubscriptionQuotaView {
  codeText: string;
  labelText: string;
  locale: string;
  ownerIdText: string;
  limit: string;
  budgetText: string;
  checksumText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    labelText: string,
    locale: string,
    ownerIdText: string,
    limit: string,
    budgetText: string,
    checksumText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.labelText = labelText;
    this.locale = locale;
    this.ownerIdText = ownerIdText;
    this.limit = limit;
    this.budgetText = budgetText;
    this.checksumText = checksumText;
    this.statusLabel = statusLabel;
  }
}

export function toSubscriptionQuotaView(item: SubscriptionQuota): SubscriptionQuotaView {
  return new SubscriptionQuotaView(
    item.code,
    item.label,
    item.locale,
    text.truncate(item.ownerId, 120),
    String(item.limit),
    item.budget.toFixed(2),
    item.checksum,
    `${item.status}`.toUpperCase(),
  );
}

export function toSubscriptionQuotaViews(items: SubscriptionQuota[]): SubscriptionQuotaView[] {
  const views: SubscriptionQuotaView[] = [];
  for (const item of items) {
    views.push(toSubscriptionQuotaView(item));
  }
  return views;
}

export function sumSubscriptionQuotaView(view: SubscriptionQuotaView): number {
  const parsedLimit = Number(view.limit);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limit} is not a number`);
  const parsedBudget = Number(view.budgetText);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budgetText} is not a number`);
  return parsedLimit + parsedBudget;
}
