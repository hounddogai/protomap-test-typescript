import * as text from "../../../../kit/text.js";
import { ModelReview } from "./model-review.js";

/** How screens and exports show a model review. */
export class ModelReviewView {
  code: string;
  name: string;
  rate: string;
  endsAt: string;
  phoneText: string;
  archived: string;
  currencyText: string;
  timezoneText: string;
  sendAt: string;
  description: string;
  sourceText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    rate: string,
    endsAt: string,
    phoneText: string,
    archived: string,
    currencyText: string,
    timezoneText: string,
    sendAt: string,
    description: string,
    sourceText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.rate = rate;
    this.endsAt = endsAt;
    this.phoneText = phoneText;
    this.archived = archived;
    this.currencyText = currencyText;
    this.timezoneText = timezoneText;
    this.sendAt = sendAt;
    this.description = description;
    this.sourceText = sourceText;
    this.statusLabel = statusLabel;
  }
}

export function toModelReviewView(item: ModelReview): ModelReviewView {
  return new ModelReviewView(
    text.truncate(item.code, 40),
    item.name,
    item.rate.toFixed(2),
    String(item.endsAt),
    text.truncate(item.phone, 40),
    `${item.archived}`,
    item.currency,
    item.timezone,
    String(item.sendAt),
    item.description,
    item.source,
    `${item.status}`.toUpperCase(),
  );
}

export function toModelReviewViews(items: ModelReview[]): ModelReviewView[] {
  const views: ModelReviewView[] = [];
  for (const item of items) {
    views.push(toModelReviewView(item));
  }
  return views;
}

export function sumModelReviewView(view: ModelReviewView): number {
  const parsedRate = Number(view.rate);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rate} is not a number`);
  const parsedEndsAt = Number(view.endsAt);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAt} is not a number`);
  const parsedSendAt = Number(view.sendAt);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAt} is not a number`);
  return parsedRate + parsedEndsAt + parsedSendAt;
}
