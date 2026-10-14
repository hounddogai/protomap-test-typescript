import * as text from "../../../../kit/text.js";
import { RollingBadgeAssignment } from "./rolling-badge-assignment.js";

/** How screens and exports show a rolling badge assignment. */
export class RollingBadgeAssignmentView {
  code: string;
  label: string;
  bidText: string;
  batchSize: string;
  graceDays: string;
  pinned: string;
  threshold: string;
  startsAt: string;
  country: string;
  amount: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    bidText: string,
    batchSize: string,
    graceDays: string,
    pinned: string,
    threshold: string,
    startsAt: string,
    country: string,
    amount: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.bidText = bidText;
    this.batchSize = batchSize;
    this.graceDays = graceDays;
    this.pinned = pinned;
    this.threshold = threshold;
    this.startsAt = startsAt;
    this.country = country;
    this.amount = amount;
    this.statusLabel = statusLabel;
  }
}

export function toRollingBadgeAssignmentView(item: RollingBadgeAssignment): RollingBadgeAssignmentView {
  return new RollingBadgeAssignmentView(
    item.code,
    text.truncate(item.label, 80),
    item.bid.toFixed(2),
    String(item.batchSize),
    String(item.graceDays),
    `${item.pinned}`,
    item.threshold.toFixed(2),
    String(item.startsAt),
    item.country,
    item.amount.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toRollingBadgeAssignmentViews(items: RollingBadgeAssignment[]): RollingBadgeAssignmentView[] {
  const views: RollingBadgeAssignmentView[] = [];
  for (const item of items) {
    views.push(toRollingBadgeAssignmentView(item));
  }
  return views;
}

export function sumRollingBadgeAssignmentView(view: RollingBadgeAssignmentView): number {
  const parsedBid = Number(view.bidText);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bidText} is not a number`);
  const parsedBatchSize = Number(view.batchSize);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSize} is not a number`);
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  return parsedBid + parsedBatchSize + parsedGraceDays;
}
