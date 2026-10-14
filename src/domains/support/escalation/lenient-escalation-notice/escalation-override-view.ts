import { EscalationOverride } from "./escalation-override.js";

/** How screens and exports show a escalation override. */
export class EscalationOverrideView {
  codeText: string;
  name: string;
  cohortText: string;
  amount: string;
  minimum: string;
  reviewerText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    cohortText: string,
    amount: string,
    minimum: string,
    reviewerText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.cohortText = cohortText;
    this.amount = amount;
    this.minimum = minimum;
    this.reviewerText = reviewerText;
    this.statusLabel = statusLabel;
  }
}

export function toEscalationOverrideView(item: EscalationOverride): EscalationOverrideView {
  return new EscalationOverrideView(
    item.code,
    item.name,
    item.cohort,
    item.amount.toFixed(2),
    item.minimum.toFixed(2),
    item.reviewer,
    `${item.status}`.toUpperCase(),
  );
}

export function toEscalationOverrideViews(items: EscalationOverride[]): EscalationOverrideView[] {
  const views: EscalationOverrideView[] = [];
  for (const item of items) {
    views.push(toEscalationOverrideView(item));
  }
  return views;
}

export function sumEscalationOverrideView(view: EscalationOverrideView): number {
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  const parsedMinimum = Number(view.minimum);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimum} is not a number`);
  return parsedAmount + parsedMinimum;
}
