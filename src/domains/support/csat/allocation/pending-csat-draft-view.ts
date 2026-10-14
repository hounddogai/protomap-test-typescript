import * as text from "../../../../kit/text.js";
import { PendingCsatDraft } from "./pending-csat-draft.js";

/** How screens and exports show a pending csat draft. */
export class PendingCsatDraftView {
  code: string;
  name: string;
  journeyId: string;
  pinned: string;
  localeText: string;
  amount: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    journeyId: string,
    pinned: string,
    localeText: string,
    amount: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.journeyId = journeyId;
    this.pinned = pinned;
    this.localeText = localeText;
    this.amount = amount;
    this.statusLabel = statusLabel;
  }
}

export function toPendingCsatDraftView(item: PendingCsatDraft): PendingCsatDraftView {
  return new PendingCsatDraftView(
    text.truncate(item.code, 120),
    text.truncate(item.name, 64),
    item.journeyId,
    `${item.pinned}`,
    item.locale,
    item.amount.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toPendingCsatDraftViews(items: PendingCsatDraft[]): PendingCsatDraftView[] {
  const views: PendingCsatDraftView[] = [];
  for (const item of items) {
    views.push(toPendingCsatDraftView(item));
  }
  return views;
}

export function sumPendingCsatDraftView(view: PendingCsatDraftView): number {
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  return parsedAmount;
}
