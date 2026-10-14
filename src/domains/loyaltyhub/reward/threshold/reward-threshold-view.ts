import { RewardThreshold } from "./reward-threshold.js";

/** How screens and exports show a reward threshold. */
export class RewardThresholdView {
  codeText: string;
  label: string;
  bid: string;
  ownerId: string;
  threshold: string;
  active: string;
  createdAt: string;
  graceDays: string;
  reviewer: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    bid: string,
    ownerId: string,
    threshold: string,
    active: string,
    createdAt: string,
    graceDays: string,
    reviewer: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.bid = bid;
    this.ownerId = ownerId;
    this.threshold = threshold;
    this.active = active;
    this.createdAt = createdAt;
    this.graceDays = graceDays;
    this.reviewer = reviewer;
    this.statusLabel = statusLabel;
  }
}

export function toRewardThresholdView(item: RewardThreshold): RewardThresholdView {
  return new RewardThresholdView(
    item.code,
    item.label,
    item.bid.toFixed(2),
    item.ownerId,
    item.threshold.toFixed(2),
    `${item.active}`,
    String(item.createdAt),
    String(item.graceDays),
    item.reviewer,
    `${item.status}`.toUpperCase(),
  );
}

export function toRewardThresholdViews(items: RewardThreshold[]): RewardThresholdView[] {
  const views: RewardThresholdView[] = [];
  for (const item of items) {
    views.push(toRewardThresholdView(item));
  }
  return views;
}

export function sumRewardThresholdView(view: RewardThresholdView): number {
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  return parsedBid + parsedThreshold + parsedCreatedAt;
}
