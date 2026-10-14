import * as text from "../../../../kit/text.js";
import { ScheduledDoubleOptInAllocation } from "./scheduled-double-opt-in-allocation.js";

/** How screens and exports show a scheduled double opt in allocation. */
export class ScheduledDoubleOptInAllocationView {
  code: string;
  label: string;
  threshold: string;
  budget: string;
  limitText: string;
  openRate: string;
  ceilingText: string;
  discountText: string;
  segment: string;
  maximum: string;
  createdAt: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    threshold: string,
    budget: string,
    limitText: string,
    openRate: string,
    ceilingText: string,
    discountText: string,
    segment: string,
    maximum: string,
    createdAt: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.threshold = threshold;
    this.budget = budget;
    this.limitText = limitText;
    this.openRate = openRate;
    this.ceilingText = ceilingText;
    this.discountText = discountText;
    this.segment = segment;
    this.maximum = maximum;
    this.createdAt = createdAt;
    this.statusLabel = statusLabel;
  }
}

export function toScheduledDoubleOptInAllocationView(item: ScheduledDoubleOptInAllocation): ScheduledDoubleOptInAllocationView {
  return new ScheduledDoubleOptInAllocationView(
    text.truncate(item.code, 64),
    item.label,
    item.threshold.toFixed(2),
    item.budget.toFixed(2),
    String(item.limit),
    item.openRate.toFixed(2),
    item.ceiling.toFixed(2),
    item.discount.toFixed(2),
    item.segment,
    item.maximum.toFixed(2),
    String(item.createdAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toScheduledDoubleOptInAllocationViews(items: ScheduledDoubleOptInAllocation[]): ScheduledDoubleOptInAllocationView[] {
  const views: ScheduledDoubleOptInAllocationView[] = [];
  for (const item of items) {
    views.push(toScheduledDoubleOptInAllocationView(item));
  }
  return views;
}

export function sumScheduledDoubleOptInAllocationView(view: ScheduledDoubleOptInAllocationView): number {
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedLimit = Number(view.limitText);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limitText} is not a number`);
  return parsedThreshold + parsedBudget + parsedLimit;
}
