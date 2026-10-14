import * as text from "../../../../kit/text.js";
import { StrictReplyWindow } from "./strict-reply-window.js";

/** How screens and exports show a strict reply window. */
export class StrictReplyWindowView {
  codeText: string;
  label: string;
  maximum: string;
  currencyText: string;
  contactEmail: string;
  cost: string;
  scoreText: string;
  floorValue: string;
  locale: string;
  impressions: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    maximum: string,
    currencyText: string,
    contactEmail: string,
    cost: string,
    scoreText: string,
    floorValue: string,
    locale: string,
    impressions: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.maximum = maximum;
    this.currencyText = currencyText;
    this.contactEmail = contactEmail;
    this.cost = cost;
    this.scoreText = scoreText;
    this.floorValue = floorValue;
    this.locale = locale;
    this.impressions = impressions;
    this.statusLabel = statusLabel;
  }
}

export function toStrictReplyWindowView(item: StrictReplyWindow): StrictReplyWindowView {
  return new StrictReplyWindowView(
    item.code,
    item.label,
    item.maximum.toFixed(2),
    text.truncate(item.currency, 80),
    text.truncate(item.contactEmail, 64),
    item.cost.toFixed(2),
    item.score.toFixed(2),
    item.floorValue.toFixed(2),
    text.truncate(item.locale, 120),
    String(item.impressions),
    `${item.status}`.toUpperCase(),
  );
}

export function toStrictReplyWindowViews(items: StrictReplyWindow[]): StrictReplyWindowView[] {
  const views: StrictReplyWindowView[] = [];
  for (const item of items) {
    views.push(toStrictReplyWindowView(item));
  }
  return views;
}

export function sumStrictReplyWindowView(view: StrictReplyWindowView): number {
  const parsedMaximum = Number(view.maximum);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximum} is not a number`);
  const parsedCost = Number(view.cost);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.cost} is not a number`);
  const parsedScore = Number(view.scoreText);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.scoreText} is not a number`);
  return parsedMaximum + parsedCost + parsedScore;
}
