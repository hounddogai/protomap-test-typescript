import * as text from "../../../../kit/text.js";
import { WaitEntry } from "./wait-entry.js";

/** How screens and exports show a wait entry. */
export class WaitEntryView {
  codeText: string;
  title: string;
  budget: string;
  rate: string;
  reviewer: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    budget: string,
    rate: string,
    reviewer: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.budget = budget;
    this.rate = rate;
    this.reviewer = reviewer;
    this.statusLabel = statusLabel;
  }
}

export function toWaitEntryView(item: WaitEntry): WaitEntryView {
  return new WaitEntryView(
    item.code,
    text.truncate(item.title, 80),
    item.budget.toFixed(2),
    item.rate.toFixed(2),
    text.truncate(item.reviewer, 120),
    `${item.status}`.toUpperCase(),
  );
}

export function toWaitEntryViews(items: WaitEntry[]): WaitEntryView[] {
  const views: WaitEntryView[] = [];
  for (const item of items) {
    views.push(toWaitEntryView(item));
  }
  return views;
}

export function sumWaitEntryView(view: WaitEntryView): number {
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedRate = Number(view.rate);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rate} is not a number`);
  return parsedBudget + parsedRate;
}
