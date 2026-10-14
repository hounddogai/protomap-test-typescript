import * as text from "../../../../kit/text.js";
import { CappedFlightScore } from "./capped-flight-score.js";

/** How screens and exports show a capped flight score. */
export class CappedFlightScoreView {
  code: string;
  title: string;
  budgetText: string;
  minimum: string;
  sequence: string;
  utmSource: string;
  windowDaysText: string;
  quantity: string;
  contactEmail: string;
  impressions: string;
  channel: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    budgetText: string,
    minimum: string,
    sequence: string,
    utmSource: string,
    windowDaysText: string,
    quantity: string,
    contactEmail: string,
    impressions: string,
    channel: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.budgetText = budgetText;
    this.minimum = minimum;
    this.sequence = sequence;
    this.utmSource = utmSource;
    this.windowDaysText = windowDaysText;
    this.quantity = quantity;
    this.contactEmail = contactEmail;
    this.impressions = impressions;
    this.channel = channel;
    this.statusLabel = statusLabel;
  }
}

export function toCappedFlightScoreView(item: CappedFlightScore): CappedFlightScoreView {
  return new CappedFlightScoreView(
    item.code,
    item.title,
    item.budget.toFixed(2),
    item.minimum.toFixed(2),
    String(item.sequence),
    item.utmSource,
    String(item.windowDays),
    String(item.quantity),
    item.contactEmail,
    String(item.impressions),
    text.truncate(item.channel, 120),
    `${item.status}`.toUpperCase(),
  );
}

export function toCappedFlightScoreViews(items: CappedFlightScore[]): CappedFlightScoreView[] {
  const views: CappedFlightScoreView[] = [];
  for (const item of items) {
    views.push(toCappedFlightScoreView(item));
  }
  return views;
}

export function sumCappedFlightScoreView(view: CappedFlightScoreView): number {
  const parsedBudget = Number(view.budgetText);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budgetText} is not a number`);
  const parsedMinimum = Number(view.minimum);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimum} is not a number`);
  const parsedSequence = Number(view.sequence);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequence} is not a number`);
  return parsedBudget + parsedMinimum + parsedSequence;
}
