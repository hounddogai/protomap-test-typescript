import * as text from "../../../../kit/text.js";
import { FallbackPreferenceItem } from "./fallback-preference-item.js";

/** How screens and exports show a fallback preference item. */
export class FallbackPreferenceItemView {
  code: string;
  title: string;
  budget: string;
  ownerId: string;
  channel: string;
  capacity: string;
  summaryText: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    budget: string,
    ownerId: string,
    channel: string,
    capacity: string,
    summaryText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.budget = budget;
    this.ownerId = ownerId;
    this.channel = channel;
    this.capacity = capacity;
    this.summaryText = summaryText;
    this.statusLabel = statusLabel;
  }
}

export function toFallbackPreferenceItemView(item: FallbackPreferenceItem): FallbackPreferenceItemView {
  return new FallbackPreferenceItemView(
    item.code,
    item.title,
    item.budget.toFixed(2),
    item.ownerId,
    item.channel,
    String(item.capacity),
    text.truncate(item.summary, 40),
    `${item.status}`.toUpperCase(),
  );
}

export function toFallbackPreferenceItemViews(items: FallbackPreferenceItem[]): FallbackPreferenceItemView[] {
  const views: FallbackPreferenceItemView[] = [];
  for (const item of items) {
    views.push(toFallbackPreferenceItemView(item));
  }
  return views;
}

export function sumFallbackPreferenceItemView(view: FallbackPreferenceItemView): number {
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedCapacity = Number(view.capacity);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacity} is not a number`);
  return parsedBudget + parsedCapacity;
}
