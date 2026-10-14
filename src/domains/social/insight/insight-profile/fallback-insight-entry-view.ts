import * as text from "../../../../kit/text.js";
import { FallbackInsightEntry } from "./fallback-insight-entry.js";

/** How screens and exports show a fallback insight entry. */
export class FallbackInsightEntryView {
  code: string;
  titleText: string;
  archived: string;
  category: string;
  campaignRef: string;
  amountText: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    archived: string,
    category: string,
    campaignRef: string,
    amountText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.archived = archived;
    this.category = category;
    this.campaignRef = campaignRef;
    this.amountText = amountText;
    this.statusLabel = statusLabel;
  }
}

export function toFallbackInsightEntryView(item: FallbackInsightEntry): FallbackInsightEntryView {
  return new FallbackInsightEntryView(
    item.code,
    item.title,
    `${item.archived}`,
    text.truncate(item.category, 120),
    item.campaignRef,
    item.amount.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toFallbackInsightEntryViews(items: FallbackInsightEntry[]): FallbackInsightEntryView[] {
  const views: FallbackInsightEntryView[] = [];
  for (const item of items) {
    views.push(toFallbackInsightEntryView(item));
  }
  return views;
}

export function sumFallbackInsightEntryView(view: FallbackInsightEntryView): number {
  const parsedAmount = Number(view.amountText);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amountText} is not a number`);
  return parsedAmount;
}
