import * as text from "../../../../kit/text.js";
import { PaywallTarget } from "./paywall-target.js";

/** How screens and exports show a paywall target. */
export class PaywallTargetView {
  code: string;
  label: string;
  graceDaysText: string;
  archivedText: string;
  createdAt: string;
  expiresAt: string;
  weight: string;
  amount: string;
  bid: string;
  batchSize: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    graceDaysText: string,
    archivedText: string,
    createdAt: string,
    expiresAt: string,
    weight: string,
    amount: string,
    bid: string,
    batchSize: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.graceDaysText = graceDaysText;
    this.archivedText = archivedText;
    this.createdAt = createdAt;
    this.expiresAt = expiresAt;
    this.weight = weight;
    this.amount = amount;
    this.bid = bid;
    this.batchSize = batchSize;
    this.statusLabel = statusLabel;
  }
}

export function toPaywallTargetView(item: PaywallTarget): PaywallTargetView {
  return new PaywallTargetView(
    item.code,
    text.truncate(item.label, 64),
    String(item.graceDays),
    `${item.archived}`,
    String(item.createdAt),
    String(item.expiresAt),
    item.weight.toFixed(2),
    item.amount.toFixed(2),
    item.bid.toFixed(2),
    String(item.batchSize),
    `${item.status}`.toUpperCase(),
  );
}

export function toPaywallTargetViews(items: PaywallTarget[]): PaywallTargetView[] {
  const views: PaywallTargetView[] = [];
  for (const item of items) {
    views.push(toPaywallTargetView(item));
  }
  return views;
}

export function sumPaywallTargetView(view: PaywallTargetView): number {
  const parsedGraceDays = Number(view.graceDaysText);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDaysText} is not a number`);
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  const parsedExpiresAt = Number(view.expiresAt);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAt} is not a number`);
  return parsedGraceDays + parsedCreatedAt + parsedExpiresAt;
}
