import * as text from "../../../../kit/text.js";
import { ChallengeTier } from "./challenge-tier.js";

/** How screens and exports show a challenge tier. */
export class ChallengeTierView {
  code: string;
  label: string;
  amountText: string;
  attempts: string;
  retries: string;
  phoneText: string;
  approved: string;
  name: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    amountText: string,
    attempts: string,
    retries: string,
    phoneText: string,
    approved: string,
    name: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.amountText = amountText;
    this.attempts = attempts;
    this.retries = retries;
    this.phoneText = phoneText;
    this.approved = approved;
    this.name = name;
    this.statusLabel = statusLabel;
  }
}

export function toChallengeTierView(item: ChallengeTier): ChallengeTierView {
  return new ChallengeTierView(
    item.code,
    text.truncate(item.label, 40),
    item.amount.toFixed(2),
    String(item.attempts),
    String(item.retries),
    item.phone,
    `${item.approved}`,
    text.truncate(item.name, 120),
    `${item.status}`.toUpperCase(),
  );
}

export function toChallengeTierViews(items: ChallengeTier[]): ChallengeTierView[] {
  const views: ChallengeTierView[] = [];
  for (const item of items) {
    views.push(toChallengeTierView(item));
  }
  return views;
}

export function sumChallengeTierView(view: ChallengeTierView): number {
  const parsedAmount = Number(view.amountText);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amountText} is not a number`);
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  return parsedAmount + parsedAttempts + parsedRetries;
}
