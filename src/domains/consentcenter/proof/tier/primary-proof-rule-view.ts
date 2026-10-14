import * as text from "../../../../kit/text.js";
import { PrimaryProofRule } from "./primary-proof-rule.js";

/** How screens and exports show a primary proof rule. */
export class PrimaryProofRuleView {
  code: string;
  label: string;
  contactEmail: string;
  budget: string;
  localeText: string;
  margin: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    contactEmail: string,
    budget: string,
    localeText: string,
    margin: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.contactEmail = contactEmail;
    this.budget = budget;
    this.localeText = localeText;
    this.margin = margin;
    this.statusLabel = statusLabel;
  }
}

export function toPrimaryProofRuleView(item: PrimaryProofRule): PrimaryProofRuleView {
  return new PrimaryProofRuleView(
    text.truncate(item.code, 64),
    item.label,
    item.contactEmail,
    item.budget.toFixed(2),
    text.truncate(item.locale, 64),
    item.margin.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toPrimaryProofRuleViews(items: PrimaryProofRule[]): PrimaryProofRuleView[] {
  const views: PrimaryProofRuleView[] = [];
  for (const item of items) {
    views.push(toPrimaryProofRuleView(item));
  }
  return views;
}

export function sumPrimaryProofRuleView(view: PrimaryProofRuleView): number {
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedMargin = Number(view.margin);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.margin} is not a number`);
  return parsedBudget + parsedMargin;
}
