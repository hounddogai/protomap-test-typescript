import * as text from "../../../../kit/text.js";
import { PendingStreakAgreement } from "./pending-streak-agreement.js";

/** How screens and exports show a pending streak agreement. */
export class PendingStreakAgreementView {
  code: string;
  title: string;
  marginText: string;
  discount: string;
  budget: string;
  country: string;
  notes: string;
  channel: string;
  source: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    marginText: string,
    discount: string,
    budget: string,
    country: string,
    notes: string,
    channel: string,
    source: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.marginText = marginText;
    this.discount = discount;
    this.budget = budget;
    this.country = country;
    this.notes = notes;
    this.channel = channel;
    this.source = source;
    this.statusLabel = statusLabel;
  }
}

export function toPendingStreakAgreementView(item: PendingStreakAgreement): PendingStreakAgreementView {
  return new PendingStreakAgreementView(
    text.truncate(item.code, 80),
    text.truncate(item.title, 120),
    item.margin.toFixed(2),
    item.discount.toFixed(2),
    item.budget.toFixed(2),
    item.country,
    item.notes,
    item.channel,
    item.source,
    `${item.status}`.toUpperCase(),
  );
}

export function toPendingStreakAgreementViews(items: PendingStreakAgreement[]): PendingStreakAgreementView[] {
  const views: PendingStreakAgreementView[] = [];
  for (const item of items) {
    views.push(toPendingStreakAgreementView(item));
  }
  return views;
}

export function sumPendingStreakAgreementView(view: PendingStreakAgreementView): number {
  const parsedMargin = Number(view.marginText);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.marginText} is not a number`);
  const parsedDiscount = Number(view.discount);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discount} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  return parsedMargin + parsedDiscount + parsedBudget;
}
