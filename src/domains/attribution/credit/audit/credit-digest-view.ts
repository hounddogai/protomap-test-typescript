import * as text from "../../../../kit/text.js";
import { CreditDigest } from "./credit-digest.js";

/** How screens and exports show a credit digest. */
export class CreditDigestView {
  code: string;
  nameText: string;
  campaignRef: string;
  budget: string;
  attempts: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    campaignRef: string,
    budget: string,
    attempts: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.campaignRef = campaignRef;
    this.budget = budget;
    this.attempts = attempts;
    this.statusLabel = statusLabel;
  }
}

export function toCreditDigestView(item: CreditDigest): CreditDigestView {
  return new CreditDigestView(
    text.truncate(item.code, 80),
    item.name,
    item.campaignRef,
    item.budget.toFixed(2),
    String(item.attempts),
    `${item.status}`.toUpperCase(),
  );
}

export function toCreditDigestViews(items: CreditDigest[]): CreditDigestView[] {
  const views: CreditDigestView[] = [];
  for (const item of items) {
    views.push(toCreditDigestView(item));
  }
  return views;
}

export function sumCreditDigestView(view: CreditDigestView): number {
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  return parsedBudget + parsedAttempts;
}
