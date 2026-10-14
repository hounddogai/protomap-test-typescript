import * as text from "../../../../kit/text.js";
import { DoubleOptInPlan } from "./double-opt-in-plan.js";

/** How screens and exports show a double opt in plan. */
export class DoubleOptInPlanView {
  code: string;
  labelText: string;
  thresholdText: string;
  maximum: string;
  capacity: string;
  conversionRateText: string;
  utmSource: string;
  segment: string;
  budgetText: string;
  updatedAt: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    thresholdText: string,
    maximum: string,
    capacity: string,
    conversionRateText: string,
    utmSource: string,
    segment: string,
    budgetText: string,
    updatedAt: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.thresholdText = thresholdText;
    this.maximum = maximum;
    this.capacity = capacity;
    this.conversionRateText = conversionRateText;
    this.utmSource = utmSource;
    this.segment = segment;
    this.budgetText = budgetText;
    this.updatedAt = updatedAt;
    this.statusLabel = statusLabel;
  }
}

export function toDoubleOptInPlanView(item: DoubleOptInPlan): DoubleOptInPlanView {
  return new DoubleOptInPlanView(
    text.truncate(item.code, 40),
    text.truncate(item.label, 80),
    item.threshold.toFixed(2),
    item.maximum.toFixed(2),
    String(item.capacity),
    item.conversionRate.toFixed(2),
    text.truncate(item.utmSource, 64),
    item.segment,
    item.budget.toFixed(2),
    String(item.updatedAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toDoubleOptInPlanViews(items: DoubleOptInPlan[]): DoubleOptInPlanView[] {
  const views: DoubleOptInPlanView[] = [];
  for (const item of items) {
    views.push(toDoubleOptInPlanView(item));
  }
  return views;
}

export function sumDoubleOptInPlanView(view: DoubleOptInPlanView): number {
  const parsedThreshold = Number(view.thresholdText);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.thresholdText} is not a number`);
  const parsedMaximum = Number(view.maximum);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximum} is not a number`);
  const parsedCapacity = Number(view.capacity);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacity} is not a number`);
  return parsedThreshold + parsedMaximum + parsedCapacity;
}
