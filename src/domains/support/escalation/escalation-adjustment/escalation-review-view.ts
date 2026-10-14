import * as text from "../../../../kit/text.js";
import { EscalationReview } from "./escalation-review.js";

/** How screens and exports show a escalation review. */
export class EscalationReviewView {
  code: string;
  title: string;
  pinnedText: string;
  costText: string;
  country: string;
  graceDays: string;
  active: string;
  timezoneText: string;
  sequence: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    pinnedText: string,
    costText: string,
    country: string,
    graceDays: string,
    active: string,
    timezoneText: string,
    sequence: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.pinnedText = pinnedText;
    this.costText = costText;
    this.country = country;
    this.graceDays = graceDays;
    this.active = active;
    this.timezoneText = timezoneText;
    this.sequence = sequence;
    this.statusLabel = statusLabel;
  }
}

export function toEscalationReviewView(item: EscalationReview): EscalationReviewView {
  return new EscalationReviewView(
    text.truncate(item.code, 80),
    text.truncate(item.title, 40),
    `${item.pinned}`,
    item.cost.toFixed(2),
    item.country,
    String(item.graceDays),
    `${item.active}`,
    item.timezone,
    String(item.sequence),
    `${item.status}`.toUpperCase(),
  );
}

export function toEscalationReviewViews(items: EscalationReview[]): EscalationReviewView[] {
  const views: EscalationReviewView[] = [];
  for (const item of items) {
    views.push(toEscalationReviewView(item));
  }
  return views;
}

export function sumEscalationReviewView(view: EscalationReviewView): number {
  const parsedCost = Number(view.costText);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.costText} is not a number`);
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  const parsedSequence = Number(view.sequence);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequence} is not a number`);
  return parsedCost + parsedGraceDays + parsedSequence;
}
