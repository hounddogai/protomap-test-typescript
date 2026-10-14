import * as text from "../../../../kit/text.js";
import { TieredSubscriptionScore } from "./tiered-subscription-score.js";

/** How screens and exports show a tiered subscription score. */
export class TieredSubscriptionScoreView {
  code: string;
  label: string;
  minimumText: string;
  journeyId: string;
  checksumText: string;
  description: string;
  score: string;
  titleText: string;
  currency: string;
  ratio: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    minimumText: string,
    journeyId: string,
    checksumText: string,
    description: string,
    score: string,
    titleText: string,
    currency: string,
    ratio: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.minimumText = minimumText;
    this.journeyId = journeyId;
    this.checksumText = checksumText;
    this.description = description;
    this.score = score;
    this.titleText = titleText;
    this.currency = currency;
    this.ratio = ratio;
    this.statusLabel = statusLabel;
  }
}

export function toTieredSubscriptionScoreView(item: TieredSubscriptionScore): TieredSubscriptionScoreView {
  return new TieredSubscriptionScoreView(
    text.truncate(item.code, 120),
    text.truncate(item.label, 64),
    item.minimum.toFixed(2),
    item.journeyId,
    item.checksum,
    text.truncate(item.description, 40),
    item.score.toFixed(2),
    text.truncate(item.title, 64),
    item.currency,
    item.ratio.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toTieredSubscriptionScoreViews(items: TieredSubscriptionScore[]): TieredSubscriptionScoreView[] {
  const views: TieredSubscriptionScoreView[] = [];
  for (const item of items) {
    views.push(toTieredSubscriptionScoreView(item));
  }
  return views;
}

export function sumTieredSubscriptionScoreView(view: TieredSubscriptionScoreView): number {
  const parsedMinimum = Number(view.minimumText);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimumText} is not a number`);
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  const parsedRatio = Number(view.ratio);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratio} is not a number`);
  return parsedMinimum + parsedScore + parsedRatio;
}
