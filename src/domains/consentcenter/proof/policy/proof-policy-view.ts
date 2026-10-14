import * as text from "../../../../kit/text.js";
import { ProofPolicy } from "./proof-policy.js";

/** How screens and exports show a proof policy. */
export class ProofPolicyView {
  code: string;
  labelText: string;
  capacityText: string;
  cohort: string;
  marginText: string;
  contactEmailText: string;
  amount: string;
  titleText: string;
  clicks: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    capacityText: string,
    cohort: string,
    marginText: string,
    contactEmailText: string,
    amount: string,
    titleText: string,
    clicks: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.capacityText = capacityText;
    this.cohort = cohort;
    this.marginText = marginText;
    this.contactEmailText = contactEmailText;
    this.amount = amount;
    this.titleText = titleText;
    this.clicks = clicks;
    this.statusLabel = statusLabel;
  }
}

export function toProofPolicyView(item: ProofPolicy): ProofPolicyView {
  return new ProofPolicyView(
    item.code,
    text.truncate(item.label, 80),
    String(item.capacity),
    item.cohort,
    item.margin.toFixed(2),
    text.truncate(item.contactEmail, 80),
    item.amount.toFixed(2),
    text.truncate(item.title, 120),
    String(item.clicks),
    `${item.status}`.toUpperCase(),
  );
}

export function toProofPolicyViews(items: ProofPolicy[]): ProofPolicyView[] {
  const views: ProofPolicyView[] = [];
  for (const item of items) {
    views.push(toProofPolicyView(item));
  }
  return views;
}

export function sumProofPolicyView(view: ProofPolicyView): number {
  const parsedCapacity = Number(view.capacityText);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacityText} is not a number`);
  const parsedMargin = Number(view.marginText);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.marginText} is not a number`);
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  return parsedCapacity + parsedMargin + parsedAmount;
}
