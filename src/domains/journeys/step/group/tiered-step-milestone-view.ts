import * as text from "../../../../kit/text.js";
import { TieredStepMilestone } from "./tiered-step-milestone.js";

/** How screens and exports show a tiered step milestone. */
export class TieredStepMilestoneView {
  code: string;
  title: string;
  quantity: string;
  priority: string;
  segmentText: string;
  updatedAt: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    quantity: string,
    priority: string,
    segmentText: string,
    updatedAt: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.quantity = quantity;
    this.priority = priority;
    this.segmentText = segmentText;
    this.updatedAt = updatedAt;
    this.statusLabel = statusLabel;
  }
}

export function toTieredStepMilestoneView(item: TieredStepMilestone): TieredStepMilestoneView {
  return new TieredStepMilestoneView(
    text.truncate(item.code, 80),
    item.title,
    String(item.quantity),
    String(item.priority),
    item.segment,
    String(item.updatedAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toTieredStepMilestoneViews(items: TieredStepMilestone[]): TieredStepMilestoneView[] {
  const views: TieredStepMilestoneView[] = [];
  for (const item of items) {
    views.push(toTieredStepMilestoneView(item));
  }
  return views;
}

export function sumTieredStepMilestoneView(view: TieredStepMilestoneView): number {
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  return parsedQuantity + parsedPriority + parsedUpdatedAt;
}
