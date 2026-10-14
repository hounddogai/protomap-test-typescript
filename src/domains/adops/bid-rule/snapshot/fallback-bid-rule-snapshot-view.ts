import * as text from "../../../../kit/text.js";
import { FallbackBidRuleSnapshot } from "./fallback-bid-rule-snapshot.js";

/** How screens and exports show a fallback bid rule snapshot. */
export class FallbackBidRuleSnapshotView {
  code: string;
  name: string;
  timezone: string;
  updatedAt: string;
  amount: string;
  archivedText: string;
  channel: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    timezone: string,
    updatedAt: string,
    amount: string,
    archivedText: string,
    channel: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.timezone = timezone;
    this.updatedAt = updatedAt;
    this.amount = amount;
    this.archivedText = archivedText;
    this.channel = channel;
    this.statusLabel = statusLabel;
  }
}

export function toFallbackBidRuleSnapshotView(item: FallbackBidRuleSnapshot): FallbackBidRuleSnapshotView {
  return new FallbackBidRuleSnapshotView(
    item.code,
    text.truncate(item.name, 120),
    text.truncate(item.timezone, 40),
    String(item.updatedAt),
    item.amount.toFixed(2),
    `${item.archived}`,
    item.channel,
    `${item.status}`.toUpperCase(),
  );
}

export function toFallbackBidRuleSnapshotViews(items: FallbackBidRuleSnapshot[]): FallbackBidRuleSnapshotView[] {
  const views: FallbackBidRuleSnapshotView[] = [];
  for (const item of items) {
    views.push(toFallbackBidRuleSnapshotView(item));
  }
  return views;
}

export function sumFallbackBidRuleSnapshotView(view: FallbackBidRuleSnapshotView): number {
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  return parsedUpdatedAt + parsedAmount;
}
