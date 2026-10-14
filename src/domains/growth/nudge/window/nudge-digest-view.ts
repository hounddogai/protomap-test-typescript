import * as text from "../../../../kit/text.js";
import { NudgeDigest } from "./nudge-digest.js";

/** How screens and exports show a nudge digest. */
export class NudgeDigestView {
  code: string;
  title: string;
  amount: string;
  descriptionText: string;
  rate: string;
  unit: string;
  retries: string;
  openRate: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    amount: string,
    descriptionText: string,
    rate: string,
    unit: string,
    retries: string,
    openRate: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.amount = amount;
    this.descriptionText = descriptionText;
    this.rate = rate;
    this.unit = unit;
    this.retries = retries;
    this.openRate = openRate;
    this.statusLabel = statusLabel;
  }
}

export function toNudgeDigestView(item: NudgeDigest): NudgeDigestView {
  return new NudgeDigestView(
    item.code,
    text.truncate(item.title, 80),
    item.amount.toFixed(2),
    item.description,
    item.rate.toFixed(2),
    item.unit,
    String(item.retries),
    item.openRate.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toNudgeDigestViews(items: NudgeDigest[]): NudgeDigestView[] {
  const views: NudgeDigestView[] = [];
  for (const item of items) {
    views.push(toNudgeDigestView(item));
  }
  return views;
}

export function sumNudgeDigestView(view: NudgeDigestView): number {
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  const parsedRate = Number(view.rate);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rate} is not a number`);
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  return parsedAmount + parsedRate + parsedRetries;
}
