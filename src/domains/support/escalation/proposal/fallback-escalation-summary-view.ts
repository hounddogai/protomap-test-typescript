import * as text from "../../../../kit/text.js";
import { FallbackEscalationSummary } from "./fallback-escalation-summary.js";

/** How screens and exports show a fallback escalation summary. */
export class FallbackEscalationSummaryView {
  code: string;
  name: string;
  minimum: string;
  titleText: string;
  priority: string;
  bid: string;
  attemptsText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    minimum: string,
    titleText: string,
    priority: string,
    bid: string,
    attemptsText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.minimum = minimum;
    this.titleText = titleText;
    this.priority = priority;
    this.bid = bid;
    this.attemptsText = attemptsText;
    this.statusLabel = statusLabel;
  }
}

export function toFallbackEscalationSummaryView(item: FallbackEscalationSummary): FallbackEscalationSummaryView {
  return new FallbackEscalationSummaryView(
    item.code,
    text.truncate(item.name, 40),
    item.minimum.toFixed(2),
    item.title,
    String(item.priority),
    item.bid.toFixed(2),
    String(item.attempts),
    `${item.status}`.toUpperCase(),
  );
}

export function toFallbackEscalationSummaryViews(items: FallbackEscalationSummary[]): FallbackEscalationSummaryView[] {
  const views: FallbackEscalationSummaryView[] = [];
  for (const item of items) {
    views.push(toFallbackEscalationSummaryView(item));
  }
  return views;
}

export function sumFallbackEscalationSummaryView(view: FallbackEscalationSummaryView): number {
  const parsedMinimum = Number(view.minimum);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimum} is not a number`);
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  return parsedMinimum + parsedPriority + parsedBid;
}
