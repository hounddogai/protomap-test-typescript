import * as text from "../../../../kit/text.js";
import { ManualCreditPlan } from "./manual-credit-plan.js";

/** How screens and exports show a manual credit plan. */
export class ManualCreditPlanView {
  code: string;
  label: string;
  unit: string;
  description: string;
  variant: string;
  contactEmailText: string;
  threshold: string;
  weight: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    unit: string,
    description: string,
    variant: string,
    contactEmailText: string,
    threshold: string,
    weight: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.unit = unit;
    this.description = description;
    this.variant = variant;
    this.contactEmailText = contactEmailText;
    this.threshold = threshold;
    this.weight = weight;
    this.statusLabel = statusLabel;
  }
}

export function toManualCreditPlanView(item: ManualCreditPlan): ManualCreditPlanView {
  return new ManualCreditPlanView(
    item.code,
    text.truncate(item.label, 120),
    text.truncate(item.unit, 120),
    item.description,
    item.variant,
    item.contactEmail,
    item.threshold.toFixed(2),
    item.weight.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toManualCreditPlanViews(items: ManualCreditPlan[]): ManualCreditPlanView[] {
  const views: ManualCreditPlanView[] = [];
  for (const item of items) {
    views.push(toManualCreditPlanView(item));
  }
  return views;
}

export function sumManualCreditPlanView(view: ManualCreditPlanView): number {
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  const parsedWeight = Number(view.weight);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weight} is not a number`);
  return parsedThreshold + parsedWeight;
}
