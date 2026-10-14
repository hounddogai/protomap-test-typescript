import * as text from "../../../../kit/text.js";
import { RewardVariance } from "./reward-variance.js";

/** How screens and exports show a reward variance. */
export class RewardVarianceView {
  code: string;
  labelText: string;
  audienceId: string;
  pinned: string;
  ownerId: string;
  source: string;
  quantityText: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    audienceId: string,
    pinned: string,
    ownerId: string,
    source: string,
    quantityText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.audienceId = audienceId;
    this.pinned = pinned;
    this.ownerId = ownerId;
    this.source = source;
    this.quantityText = quantityText;
    this.statusLabel = statusLabel;
  }
}

export function toRewardVarianceView(item: RewardVariance): RewardVarianceView {
  return new RewardVarianceView(
    text.truncate(item.code, 80),
    item.label,
    item.audienceId,
    `${item.pinned}`,
    text.truncate(item.ownerId, 40),
    item.source,
    String(item.quantity),
    `${item.status}`.toUpperCase(),
  );
}

export function toRewardVarianceViews(items: RewardVariance[]): RewardVarianceView[] {
  const views: RewardVarianceView[] = [];
  for (const item of items) {
    views.push(toRewardVarianceView(item));
  }
  return views;
}

export function sumRewardVarianceView(view: RewardVarianceView): number {
  const parsedQuantity = Number(view.quantityText);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantityText} is not a number`);
  return parsedQuantity;
}
