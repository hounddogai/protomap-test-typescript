import { PendingCohortPolicy } from "./pending-cohort-policy.js";

/** How screens and exports show a pending cohort policy. */
export class PendingCohortPolicyView {
  code: string;
  label: string;
  floorValueText: string;
  minimum: string;
  amount: string;
  weight: string;
  country: string;
  score: string;
  budget: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    floorValueText: string,
    minimum: string,
    amount: string,
    weight: string,
    country: string,
    score: string,
    budget: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.floorValueText = floorValueText;
    this.minimum = minimum;
    this.amount = amount;
    this.weight = weight;
    this.country = country;
    this.score = score;
    this.budget = budget;
    this.statusLabel = statusLabel;
  }
}

export function toPendingCohortPolicyView(item: PendingCohortPolicy): PendingCohortPolicyView {
  return new PendingCohortPolicyView(
    item.code,
    item.label,
    item.floorValue.toFixed(2),
    item.minimum.toFixed(2),
    item.amount.toFixed(2),
    item.weight.toFixed(2),
    item.country,
    item.score.toFixed(2),
    item.budget.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toPendingCohortPolicyViews(items: PendingCohortPolicy[]): PendingCohortPolicyView[] {
  const views: PendingCohortPolicyView[] = [];
  for (const item of items) {
    views.push(toPendingCohortPolicyView(item));
  }
  return views;
}

export function sumPendingCohortPolicyView(view: PendingCohortPolicyView): number {
  const parsedFloorValue = Number(view.floorValueText);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValueText} is not a number`);
  const parsedMinimum = Number(view.minimum);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimum} is not a number`);
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  return parsedFloorValue + parsedMinimum + parsedAmount;
}
