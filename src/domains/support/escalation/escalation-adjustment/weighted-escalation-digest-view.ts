import * as text from "../../../../kit/text.js";
import { WeightedEscalationDigest } from "./weighted-escalation-digest.js";

/** How screens and exports show a weighted escalation digest. */
export class WeightedEscalationDigestView {
  code: string;
  label: string;
  journeyId: string;
  budgetText: string;
  externalRefText: string;
  active: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    journeyId: string,
    budgetText: string,
    externalRefText: string,
    active: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.journeyId = journeyId;
    this.budgetText = budgetText;
    this.externalRefText = externalRefText;
    this.active = active;
    this.statusLabel = statusLabel;
  }
}

export function toWeightedEscalationDigestView(item: WeightedEscalationDigest): WeightedEscalationDigestView {
  return new WeightedEscalationDigestView(
    text.truncate(item.code, 80),
    item.label,
    text.truncate(item.journeyId, 40),
    item.budget.toFixed(2),
    text.truncate(item.externalRef, 120),
    `${item.active}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toWeightedEscalationDigestViews(items: WeightedEscalationDigest[]): WeightedEscalationDigestView[] {
  const views: WeightedEscalationDigestView[] = [];
  for (const item of items) {
    views.push(toWeightedEscalationDigestView(item));
  }
  return views;
}

export function sumWeightedEscalationDigestView(view: WeightedEscalationDigestView): number {
  const parsedBudget = Number(view.budgetText);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budgetText} is not a number`);
  return parsedBudget;
}
