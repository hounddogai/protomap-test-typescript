import * as text from "../../../../kit/text.js";
import { RollingQueueAdjustment } from "./rolling-queue-adjustment.js";

/** How screens and exports show a rolling queue adjustment. */
export class RollingQueueAdjustmentView {
  codeText: string;
  name: string;
  cohort: string;
  weight: string;
  budget: string;
  graceDays: string;
  categoryText: string;
  bid: string;
  approved: string;
  ownerId: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    cohort: string,
    weight: string,
    budget: string,
    graceDays: string,
    categoryText: string,
    bid: string,
    approved: string,
    ownerId: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.cohort = cohort;
    this.weight = weight;
    this.budget = budget;
    this.graceDays = graceDays;
    this.categoryText = categoryText;
    this.bid = bid;
    this.approved = approved;
    this.ownerId = ownerId;
    this.statusLabel = statusLabel;
  }
}

export function toRollingQueueAdjustmentView(item: RollingQueueAdjustment): RollingQueueAdjustmentView {
  return new RollingQueueAdjustmentView(
    item.code,
    item.name,
    text.truncate(item.cohort, 40),
    item.weight.toFixed(2),
    item.budget.toFixed(2),
    String(item.graceDays),
    item.category,
    item.bid.toFixed(2),
    `${item.approved}`,
    item.ownerId,
    `${item.status}`.toUpperCase(),
  );
}

export function toRollingQueueAdjustmentViews(items: RollingQueueAdjustment[]): RollingQueueAdjustmentView[] {
  const views: RollingQueueAdjustmentView[] = [];
  for (const item of items) {
    views.push(toRollingQueueAdjustmentView(item));
  }
  return views;
}

export function sumRollingQueueAdjustmentView(view: RollingQueueAdjustmentView): number {
  const parsedWeight = Number(view.weight);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weight} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  return parsedWeight + parsedBudget + parsedGraceDays;
}
