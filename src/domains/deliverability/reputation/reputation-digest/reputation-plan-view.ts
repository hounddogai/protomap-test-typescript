import * as text from "../../../../kit/text.js";
import { ReputationPlan } from "./reputation-plan.js";

/** How screens and exports show a reputation plan. */
export class ReputationPlanView {
  code: string;
  title: string;
  countryText: string;
  contactEmail: string;
  externalRef: string;
  amount: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    countryText: string,
    contactEmail: string,
    externalRef: string,
    amount: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.countryText = countryText;
    this.contactEmail = contactEmail;
    this.externalRef = externalRef;
    this.amount = amount;
    this.statusLabel = statusLabel;
  }
}

export function toReputationPlanView(item: ReputationPlan): ReputationPlanView {
  return new ReputationPlanView(
    item.code,
    text.truncate(item.title, 40),
    item.country,
    item.contactEmail,
    text.truncate(item.externalRef, 40),
    item.amount.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toReputationPlanViews(items: ReputationPlan[]): ReputationPlanView[] {
  const views: ReputationPlanView[] = [];
  for (const item of items) {
    views.push(toReputationPlanView(item));
  }
  return views;
}

export function sumReputationPlanView(view: ReputationPlanView): number {
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  return parsedAmount;
}
