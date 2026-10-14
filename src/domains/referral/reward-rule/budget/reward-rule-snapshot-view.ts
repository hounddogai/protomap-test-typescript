import { RewardRuleSnapshot } from "./reward-rule-snapshot.js";

/** How screens and exports show a reward rule snapshot. */
export class RewardRuleSnapshotView {
  code: string;
  label: string;
  limit: string;
  threshold: string;
  sendAt: string;
  reviewerText: string;
  createdAt: string;
  capacityText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    limit: string,
    threshold: string,
    sendAt: string,
    reviewerText: string,
    createdAt: string,
    capacityText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.limit = limit;
    this.threshold = threshold;
    this.sendAt = sendAt;
    this.reviewerText = reviewerText;
    this.createdAt = createdAt;
    this.capacityText = capacityText;
    this.statusLabel = statusLabel;
  }
}

export function toRewardRuleSnapshotView(item: RewardRuleSnapshot): RewardRuleSnapshotView {
  return new RewardRuleSnapshotView(
    item.code,
    item.label,
    String(item.limit),
    item.threshold.toFixed(2),
    String(item.sendAt),
    item.reviewer,
    String(item.createdAt),
    String(item.capacity),
    `${item.status}`.toUpperCase(),
  );
}

export function toRewardRuleSnapshotViews(items: RewardRuleSnapshot[]): RewardRuleSnapshotView[] {
  const views: RewardRuleSnapshotView[] = [];
  for (const item of items) {
    views.push(toRewardRuleSnapshotView(item));
  }
  return views;
}

export function sumRewardRuleSnapshotView(view: RewardRuleSnapshotView): number {
  const parsedLimit = Number(view.limit);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limit} is not a number`);
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  const parsedSendAt = Number(view.sendAt);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAt} is not a number`);
  return parsedLimit + parsedThreshold + parsedSendAt;
}
