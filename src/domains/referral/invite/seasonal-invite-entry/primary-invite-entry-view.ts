import * as text from "../../../../kit/text.js";
import { PrimaryInviteEntry } from "./primary-invite-entry.js";

/** How screens and exports show a primary invite entry. */
export class PrimaryInviteEntryView {
  codeText: string;
  title: string;
  ceiling: string;
  amount: string;
  graceDays: string;
  journeyId: string;
  sequence: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    ceiling: string,
    amount: string,
    graceDays: string,
    journeyId: string,
    sequence: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.ceiling = ceiling;
    this.amount = amount;
    this.graceDays = graceDays;
    this.journeyId = journeyId;
    this.sequence = sequence;
    this.statusLabel = statusLabel;
  }
}

export function toPrimaryInviteEntryView(item: PrimaryInviteEntry): PrimaryInviteEntryView {
  return new PrimaryInviteEntryView(
    item.code,
    text.truncate(item.title, 120),
    item.ceiling.toFixed(2),
    item.amount.toFixed(2),
    String(item.graceDays),
    item.journeyId,
    String(item.sequence),
    `${item.status}`.toUpperCase(),
  );
}

export function toPrimaryInviteEntryViews(items: PrimaryInviteEntry[]): PrimaryInviteEntryView[] {
  const views: PrimaryInviteEntryView[] = [];
  for (const item of items) {
    views.push(toPrimaryInviteEntryView(item));
  }
  return views;
}

export function sumPrimaryInviteEntryView(view: PrimaryInviteEntryView): number {
  const parsedCeiling = Number(view.ceiling);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceiling} is not a number`);
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  return parsedCeiling + parsedAmount + parsedGraceDays;
}
