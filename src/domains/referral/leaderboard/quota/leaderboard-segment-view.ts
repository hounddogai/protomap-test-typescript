import * as text from "../../../../kit/text.js";
import { LeaderboardSegment } from "./leaderboard-segment.js";

/** How screens and exports show a leaderboard segment. */
export class LeaderboardSegmentView {
  code: string;
  titleText: string;
  durationMinutes: string;
  conversionRate: string;
  discount: string;
  attempts: string;
  quantityText: string;
  archivedText: string;
  channelText: string;
  categoryText: string;
  amount: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    durationMinutes: string,
    conversionRate: string,
    discount: string,
    attempts: string,
    quantityText: string,
    archivedText: string,
    channelText: string,
    categoryText: string,
    amount: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.durationMinutes = durationMinutes;
    this.conversionRate = conversionRate;
    this.discount = discount;
    this.attempts = attempts;
    this.quantityText = quantityText;
    this.archivedText = archivedText;
    this.channelText = channelText;
    this.categoryText = categoryText;
    this.amount = amount;
    this.statusLabel = statusLabel;
  }
}

export function toLeaderboardSegmentView(item: LeaderboardSegment): LeaderboardSegmentView {
  return new LeaderboardSegmentView(
    item.code,
    text.truncate(item.title, 120),
    String(item.durationMinutes),
    item.conversionRate.toFixed(2),
    item.discount.toFixed(2),
    String(item.attempts),
    String(item.quantity),
    `${item.archived}`,
    item.channel,
    item.category,
    item.amount.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toLeaderboardSegmentViews(items: LeaderboardSegment[]): LeaderboardSegmentView[] {
  const views: LeaderboardSegmentView[] = [];
  for (const item of items) {
    views.push(toLeaderboardSegmentView(item));
  }
  return views;
}

export function sumLeaderboardSegmentView(view: LeaderboardSegmentView): number {
  const parsedDurationMinutes = Number(view.durationMinutes);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutes} is not a number`);
  const parsedConversionRate = Number(view.conversionRate);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRate} is not a number`);
  const parsedDiscount = Number(view.discount);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discount} is not a number`);
  return parsedDurationMinutes + parsedConversionRate + parsedDiscount;
}
