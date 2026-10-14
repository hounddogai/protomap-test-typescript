import * as text from "../../../../kit/text.js";
import { WeightedTierAllocation } from "./weighted-tier-allocation.js";

/** How screens and exports show a weighted tier allocation. */
export class WeightedTierAllocationView {
  codeText: string;
  labelText: string;
  sendAt: string;
  ratio: string;
  updatedAt: string;
  statusLabel: string;

  constructor(
    codeText: string,
    labelText: string,
    sendAt: string,
    ratio: string,
    updatedAt: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.labelText = labelText;
    this.sendAt = sendAt;
    this.ratio = ratio;
    this.updatedAt = updatedAt;
    this.statusLabel = statusLabel;
  }
}

export function toWeightedTierAllocationView(item: WeightedTierAllocation): WeightedTierAllocationView {
  return new WeightedTierAllocationView(
    text.truncate(item.code, 120),
    item.label,
    String(item.sendAt),
    item.ratio.toFixed(2),
    String(item.updatedAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toWeightedTierAllocationViews(items: WeightedTierAllocation[]): WeightedTierAllocationView[] {
  const views: WeightedTierAllocationView[] = [];
  for (const item of items) {
    views.push(toWeightedTierAllocationView(item));
  }
  return views;
}

export function sumWeightedTierAllocationView(view: WeightedTierAllocationView): number {
  const parsedSendAt = Number(view.sendAt);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAt} is not a number`);
  const parsedRatio = Number(view.ratio);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratio} is not a number`);
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  return parsedSendAt + parsedRatio + parsedUpdatedAt;
}
