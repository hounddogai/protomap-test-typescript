import * as text from "../../../../kit/text.js";
import { PaywallBatch } from "./paywall-batch.js";

/** How screens and exports show a paywall batch. */
export class PaywallBatchView {
  code: string;
  titleText: string;
  ratio: string;
  activeText: string;
  retries: string;
  scoreText: string;
  country: string;
  amount: string;
  contactEmail: string;
  threshold: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    ratio: string,
    activeText: string,
    retries: string,
    scoreText: string,
    country: string,
    amount: string,
    contactEmail: string,
    threshold: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.ratio = ratio;
    this.activeText = activeText;
    this.retries = retries;
    this.scoreText = scoreText;
    this.country = country;
    this.amount = amount;
    this.contactEmail = contactEmail;
    this.threshold = threshold;
    this.statusLabel = statusLabel;
  }
}

export function toPaywallBatchView(item: PaywallBatch): PaywallBatchView {
  return new PaywallBatchView(
    text.truncate(item.code, 40),
    item.title,
    item.ratio.toFixed(2),
    `${item.active}`,
    String(item.retries),
    item.score.toFixed(2),
    item.country,
    item.amount.toFixed(2),
    item.contactEmail,
    item.threshold.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toPaywallBatchViews(items: PaywallBatch[]): PaywallBatchView[] {
  const views: PaywallBatchView[] = [];
  for (const item of items) {
    views.push(toPaywallBatchView(item));
  }
  return views;
}

export function sumPaywallBatchView(view: PaywallBatchView): number {
  const parsedRatio = Number(view.ratio);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratio} is not a number`);
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  const parsedScore = Number(view.scoreText);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.scoreText} is not a number`);
  return parsedRatio + parsedRetries + parsedScore;
}
