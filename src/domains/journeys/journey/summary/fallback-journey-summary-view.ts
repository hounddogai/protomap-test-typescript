import * as text from "../../../../kit/text.js";
import { FallbackJourneySummary } from "./fallback-journey-summary.js";

/** How screens and exports show a fallback journey summary. */
export class FallbackJourneySummaryView {
  code: string;
  name: string;
  costText: string;
  cohortText: string;
  amountText: string;
  sendAt: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    costText: string,
    cohortText: string,
    amountText: string,
    sendAt: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.costText = costText;
    this.cohortText = cohortText;
    this.amountText = amountText;
    this.sendAt = sendAt;
    this.statusLabel = statusLabel;
  }
}

export function toFallbackJourneySummaryView(item: FallbackJourneySummary): FallbackJourneySummaryView {
  return new FallbackJourneySummaryView(
    text.truncate(item.code, 64),
    item.name,
    item.cost.toFixed(2),
    item.cohort,
    item.amount.toFixed(2),
    String(item.sendAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toFallbackJourneySummaryViews(items: FallbackJourneySummary[]): FallbackJourneySummaryView[] {
  const views: FallbackJourneySummaryView[] = [];
  for (const item of items) {
    views.push(toFallbackJourneySummaryView(item));
  }
  return views;
}

export function sumFallbackJourneySummaryView(view: FallbackJourneySummaryView): number {
  const parsedCost = Number(view.costText);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.costText} is not a number`);
  const parsedAmount = Number(view.amountText);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amountText} is not a number`);
  const parsedSendAt = Number(view.sendAt);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAt} is not a number`);
  return parsedCost + parsedAmount + parsedSendAt;
}
