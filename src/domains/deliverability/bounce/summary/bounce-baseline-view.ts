import * as text from "../../../../kit/text.js";
import { BounceBaseline } from "./bounce-baseline.js";

/** How screens and exports show a bounce baseline. */
export class BounceBaselineView {
  code: string;
  title: string;
  graceDays: string;
  retries: string;
  reviewerText: string;
  margin: string;
  attempts: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    graceDays: string,
    retries: string,
    reviewerText: string,
    margin: string,
    attempts: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.graceDays = graceDays;
    this.retries = retries;
    this.reviewerText = reviewerText;
    this.margin = margin;
    this.attempts = attempts;
    this.statusLabel = statusLabel;
  }
}

export function toBounceBaselineView(item: BounceBaseline): BounceBaselineView {
  return new BounceBaselineView(
    item.code,
    text.truncate(item.title, 120),
    String(item.graceDays),
    String(item.retries),
    item.reviewer,
    item.margin.toFixed(2),
    String(item.attempts),
    `${item.status}`.toUpperCase(),
  );
}

export function toBounceBaselineViews(items: BounceBaseline[]): BounceBaselineView[] {
  const views: BounceBaselineView[] = [];
  for (const item of items) {
    views.push(toBounceBaselineView(item));
  }
  return views;
}

export function sumBounceBaselineView(view: BounceBaselineView): number {
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  const parsedMargin = Number(view.margin);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.margin} is not a number`);
  return parsedGraceDays + parsedRetries + parsedMargin;
}
