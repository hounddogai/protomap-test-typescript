import * as text from "../../../../kit/text.js";
import { BounceSummary } from "./bounce-summary.js";

/** How screens and exports show a bounce summary. */
export class BounceSummaryView {
  code: string;
  label: string;
  amount: string;
  audienceId: string;
  costText: string;
  currency: string;
  region: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    amount: string,
    audienceId: string,
    costText: string,
    currency: string,
    region: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.amount = amount;
    this.audienceId = audienceId;
    this.costText = costText;
    this.currency = currency;
    this.region = region;
    this.statusLabel = statusLabel;
  }
}

export function toBounceSummaryView(item: BounceSummary): BounceSummaryView {
  return new BounceSummaryView(
    item.code,
    item.label,
    item.amount.toFixed(2),
    item.audienceId,
    item.cost.toFixed(2),
    text.truncate(item.currency, 64),
    item.region,
    `${item.status}`.toUpperCase(),
  );
}

export function toBounceSummaryViews(items: BounceSummary[]): BounceSummaryView[] {
  const views: BounceSummaryView[] = [];
  for (const item of items) {
    views.push(toBounceSummaryView(item));
  }
  return views;
}

export function sumBounceSummaryView(view: BounceSummaryView): number {
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  const parsedCost = Number(view.costText);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.costText} is not a number`);
  return parsedAmount + parsedCost;
}
