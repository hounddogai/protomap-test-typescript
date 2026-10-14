import * as text from "../../../../kit/text.js";
import { SubscriptionScore } from "./subscription-score.js";

/** How screens and exports show a subscription score. */
export class SubscriptionScoreView {
  code: string;
  label: string;
  bid: string;
  variant: string;
  score: string;
  audienceId: string;
  quantityText: string;
  openRate: string;
  channelText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    bid: string,
    variant: string,
    score: string,
    audienceId: string,
    quantityText: string,
    openRate: string,
    channelText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.bid = bid;
    this.variant = variant;
    this.score = score;
    this.audienceId = audienceId;
    this.quantityText = quantityText;
    this.openRate = openRate;
    this.channelText = channelText;
    this.statusLabel = statusLabel;
  }
}

export function toSubscriptionScoreView(item: SubscriptionScore): SubscriptionScoreView {
  return new SubscriptionScoreView(
    item.code,
    text.truncate(item.label, 80),
    item.bid.toFixed(2),
    item.variant,
    item.score.toFixed(2),
    item.audienceId,
    String(item.quantity),
    item.openRate.toFixed(2),
    item.channel,
    `${item.status}`.toUpperCase(),
  );
}

export function toSubscriptionScoreViews(items: SubscriptionScore[]): SubscriptionScoreView[] {
  const views: SubscriptionScoreView[] = [];
  for (const item of items) {
    views.push(toSubscriptionScoreView(item));
  }
  return views;
}

export function sumSubscriptionScoreView(view: SubscriptionScoreView): number {
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  const parsedQuantity = Number(view.quantityText);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantityText} is not a number`);
  return parsedBid + parsedScore + parsedQuantity;
}
