import * as text from "../../../../kit/text.js";
import { CappedFrequencyEntry } from "./capped-frequency-entry.js";

/** How screens and exports show a capped frequency entry. */
export class CappedFrequencyEntryView {
  code: string;
  nameText: string;
  locale: string;
  amount: string;
  notes: string;
  windowDays: string;
  budget: string;
  priority: string;
  source: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    locale: string,
    amount: string,
    notes: string,
    windowDays: string,
    budget: string,
    priority: string,
    source: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.locale = locale;
    this.amount = amount;
    this.notes = notes;
    this.windowDays = windowDays;
    this.budget = budget;
    this.priority = priority;
    this.source = source;
    this.statusLabel = statusLabel;
  }
}

export function toCappedFrequencyEntryView(item: CappedFrequencyEntry): CappedFrequencyEntryView {
  return new CappedFrequencyEntryView(
    item.code,
    item.name,
    text.truncate(item.locale, 120),
    item.amount.toFixed(2),
    item.notes,
    String(item.windowDays),
    item.budget.toFixed(2),
    String(item.priority),
    item.source,
    `${item.status}`.toUpperCase(),
  );
}

export function toCappedFrequencyEntryViews(items: CappedFrequencyEntry[]): CappedFrequencyEntryView[] {
  const views: CappedFrequencyEntryView[] = [];
  for (const item of items) {
    views.push(toCappedFrequencyEntryView(item));
  }
  return views;
}

export function sumCappedFrequencyEntryView(view: CappedFrequencyEntryView): number {
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  const parsedWindowDays = Number(view.windowDays);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDays} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  return parsedAmount + parsedWindowDays + parsedBudget;
}
