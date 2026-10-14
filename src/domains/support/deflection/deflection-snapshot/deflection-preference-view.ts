import * as text from "../../../../kit/text.js";
import { DeflectionPreference } from "./deflection-preference.js";

/** How screens and exports show a deflection preference. */
export class DeflectionPreferenceView {
  codeText: string;
  name: string;
  categoryText: string;
  endsAt: string;
  capacity: string;
  bid: string;
  budget: string;
  externalRef: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    categoryText: string,
    endsAt: string,
    capacity: string,
    bid: string,
    budget: string,
    externalRef: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.categoryText = categoryText;
    this.endsAt = endsAt;
    this.capacity = capacity;
    this.bid = bid;
    this.budget = budget;
    this.externalRef = externalRef;
    this.statusLabel = statusLabel;
  }
}

export function toDeflectionPreferenceView(item: DeflectionPreference): DeflectionPreferenceView {
  return new DeflectionPreferenceView(
    item.code,
    text.truncate(item.name, 64),
    item.category,
    String(item.endsAt),
    String(item.capacity),
    item.bid.toFixed(2),
    item.budget.toFixed(2),
    text.truncate(item.externalRef, 40),
    `${item.status}`.toUpperCase(),
  );
}

export function toDeflectionPreferenceViews(items: DeflectionPreference[]): DeflectionPreferenceView[] {
  const views: DeflectionPreferenceView[] = [];
  for (const item of items) {
    views.push(toDeflectionPreferenceView(item));
  }
  return views;
}

export function sumDeflectionPreferenceView(view: DeflectionPreferenceView): number {
  const parsedEndsAt = Number(view.endsAt);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAt} is not a number`);
  const parsedCapacity = Number(view.capacity);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacity} is not a number`);
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  return parsedEndsAt + parsedCapacity + parsedBid;
}
