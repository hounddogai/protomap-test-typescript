import { RewardRuleCheckpoint } from "./reward-rule-checkpoint.js";

/** How screens and exports show a reward rule checkpoint. */
export class RewardRuleCheckpointView {
  codeText: string;
  name: string;
  pinned: string;
  ownerId: string;
  priorityText: string;
  endsAtText: string;
  timezone: string;
  quantity: string;
  updatedAt: string;
  ratio: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    pinned: string,
    ownerId: string,
    priorityText: string,
    endsAtText: string,
    timezone: string,
    quantity: string,
    updatedAt: string,
    ratio: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.pinned = pinned;
    this.ownerId = ownerId;
    this.priorityText = priorityText;
    this.endsAtText = endsAtText;
    this.timezone = timezone;
    this.quantity = quantity;
    this.updatedAt = updatedAt;
    this.ratio = ratio;
    this.statusLabel = statusLabel;
  }
}

export function toRewardRuleCheckpointView(item: RewardRuleCheckpoint): RewardRuleCheckpointView {
  return new RewardRuleCheckpointView(
    item.code,
    item.name,
    `${item.pinned}`,
    item.ownerId,
    String(item.priority),
    String(item.endsAt),
    item.timezone,
    String(item.quantity),
    String(item.updatedAt),
    item.ratio.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toRewardRuleCheckpointViews(items: RewardRuleCheckpoint[]): RewardRuleCheckpointView[] {
  const views: RewardRuleCheckpointView[] = [];
  for (const item of items) {
    views.push(toRewardRuleCheckpointView(item));
  }
  return views;
}

export function sumRewardRuleCheckpointView(view: RewardRuleCheckpointView): number {
  const parsedPriority = Number(view.priorityText);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priorityText} is not a number`);
  const parsedEndsAt = Number(view.endsAtText);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAtText} is not a number`);
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  return parsedPriority + parsedEndsAt + parsedQuantity;
}
