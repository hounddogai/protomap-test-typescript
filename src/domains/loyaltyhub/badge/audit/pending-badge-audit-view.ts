import * as text from "../../../../kit/text.js";
import { PendingBadgeAudit } from "./pending-badge-audit.js";

/** How screens and exports show a pending badge audit. */
export class PendingBadgeAuditView {
  code: string;
  title: string;
  startsAt: string;
  amount: string;
  variant: string;
  timezone: string;
  createdAt: string;
  approved: string;
  name: string;
  currencyText: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    startsAt: string,
    amount: string,
    variant: string,
    timezone: string,
    createdAt: string,
    approved: string,
    name: string,
    currencyText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.startsAt = startsAt;
    this.amount = amount;
    this.variant = variant;
    this.timezone = timezone;
    this.createdAt = createdAt;
    this.approved = approved;
    this.name = name;
    this.currencyText = currencyText;
    this.statusLabel = statusLabel;
  }
}

export function toPendingBadgeAuditView(item: PendingBadgeAudit): PendingBadgeAuditView {
  return new PendingBadgeAuditView(
    item.code,
    item.title,
    String(item.startsAt),
    item.amount.toFixed(2),
    item.variant,
    text.truncate(item.timezone, 120),
    String(item.createdAt),
    `${item.approved}`,
    item.name,
    text.truncate(item.currency, 80),
    `${item.status}`.toUpperCase(),
  );
}

export function toPendingBadgeAuditViews(items: PendingBadgeAudit[]): PendingBadgeAuditView[] {
  const views: PendingBadgeAuditView[] = [];
  for (const item of items) {
    views.push(toPendingBadgeAuditView(item));
  }
  return views;
}

export function sumPendingBadgeAuditView(view: PendingBadgeAuditView): number {
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  return parsedStartsAt + parsedAmount + parsedCreatedAt;
}
