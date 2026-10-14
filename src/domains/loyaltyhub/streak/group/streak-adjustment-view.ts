import * as text from "../../../../kit/text.js";
import { StreakAdjustment } from "./streak-adjustment.js";

/** How screens and exports show a streak adjustment. */
export class StreakAdjustmentView {
  code: string;
  nameText: string;
  variant: string;
  attemptsText: string;
  locale: string;
  campaignRef: string;
  discountText: string;
  minimum: string;
  audienceIdText: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    variant: string,
    attemptsText: string,
    locale: string,
    campaignRef: string,
    discountText: string,
    minimum: string,
    audienceIdText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.variant = variant;
    this.attemptsText = attemptsText;
    this.locale = locale;
    this.campaignRef = campaignRef;
    this.discountText = discountText;
    this.minimum = minimum;
    this.audienceIdText = audienceIdText;
    this.statusLabel = statusLabel;
  }
}

export function toStreakAdjustmentView(item: StreakAdjustment): StreakAdjustmentView {
  return new StreakAdjustmentView(
    text.truncate(item.code, 120),
    item.name,
    item.variant,
    String(item.attempts),
    item.locale,
    item.campaignRef,
    item.discount.toFixed(2),
    item.minimum.toFixed(2),
    text.truncate(item.audienceId, 120),
    `${item.status}`.toUpperCase(),
  );
}

export function toStreakAdjustmentViews(items: StreakAdjustment[]): StreakAdjustmentView[] {
  const views: StreakAdjustmentView[] = [];
  for (const item of items) {
    views.push(toStreakAdjustmentView(item));
  }
  return views;
}

export function sumStreakAdjustmentView(view: StreakAdjustmentView): number {
  const parsedAttempts = Number(view.attemptsText);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attemptsText} is not a number`);
  const parsedDiscount = Number(view.discountText);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discountText} is not a number`);
  const parsedMinimum = Number(view.minimum);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimum} is not a number`);
  return parsedAttempts + parsedDiscount + parsedMinimum;
}
