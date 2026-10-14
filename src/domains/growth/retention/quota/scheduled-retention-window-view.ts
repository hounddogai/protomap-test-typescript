import { ScheduledRetentionWindow } from "./scheduled-retention-window.js";

/** How screens and exports show a scheduled retention window. */
export class ScheduledRetentionWindowView {
  code: string;
  nameText: string;
  conversionRate: string;
  scoreText: string;
  discount: string;
  openRateText: string;
  sendAt: string;
  titleText: string;
  ownerIdText: string;
  rate: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    conversionRate: string,
    scoreText: string,
    discount: string,
    openRateText: string,
    sendAt: string,
    titleText: string,
    ownerIdText: string,
    rate: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.conversionRate = conversionRate;
    this.scoreText = scoreText;
    this.discount = discount;
    this.openRateText = openRateText;
    this.sendAt = sendAt;
    this.titleText = titleText;
    this.ownerIdText = ownerIdText;
    this.rate = rate;
    this.statusLabel = statusLabel;
  }
}

export function toScheduledRetentionWindowView(item: ScheduledRetentionWindow): ScheduledRetentionWindowView {
  return new ScheduledRetentionWindowView(
    item.code,
    item.name,
    item.conversionRate.toFixed(2),
    item.score.toFixed(2),
    item.discount.toFixed(2),
    item.openRate.toFixed(2),
    String(item.sendAt),
    item.title,
    item.ownerId,
    item.rate.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toScheduledRetentionWindowViews(items: ScheduledRetentionWindow[]): ScheduledRetentionWindowView[] {
  const views: ScheduledRetentionWindowView[] = [];
  for (const item of items) {
    views.push(toScheduledRetentionWindowView(item));
  }
  return views;
}

export function sumScheduledRetentionWindowView(view: ScheduledRetentionWindowView): number {
  const parsedConversionRate = Number(view.conversionRate);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRate} is not a number`);
  const parsedScore = Number(view.scoreText);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.scoreText} is not a number`);
  const parsedDiscount = Number(view.discount);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discount} is not a number`);
  return parsedConversionRate + parsedScore + parsedDiscount;
}
