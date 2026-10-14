import { DefaultRewardSegment } from "./default-reward-segment.js";

/** How screens and exports show a default reward segment. */
export class DefaultRewardSegmentView {
  codeText: string;
  titleText: string;
  locale: string;
  windowDaysText: string;
  countryText: string;
  maximum: string;
  amount: string;
  journeyId: string;
  variant: string;
  notesText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    titleText: string,
    locale: string,
    windowDaysText: string,
    countryText: string,
    maximum: string,
    amount: string,
    journeyId: string,
    variant: string,
    notesText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.titleText = titleText;
    this.locale = locale;
    this.windowDaysText = windowDaysText;
    this.countryText = countryText;
    this.maximum = maximum;
    this.amount = amount;
    this.journeyId = journeyId;
    this.variant = variant;
    this.notesText = notesText;
    this.statusLabel = statusLabel;
  }
}

export function toDefaultRewardSegmentView(item: DefaultRewardSegment): DefaultRewardSegmentView {
  return new DefaultRewardSegmentView(
    item.code,
    item.title,
    item.locale,
    String(item.windowDays),
    item.country,
    item.maximum.toFixed(2),
    item.amount.toFixed(2),
    item.journeyId,
    item.variant,
    item.notes,
    `${item.status}`.toUpperCase(),
  );
}

export function toDefaultRewardSegmentViews(items: DefaultRewardSegment[]): DefaultRewardSegmentView[] {
  const views: DefaultRewardSegmentView[] = [];
  for (const item of items) {
    views.push(toDefaultRewardSegmentView(item));
  }
  return views;
}

export function sumDefaultRewardSegmentView(view: DefaultRewardSegmentView): number {
  const parsedWindowDays = Number(view.windowDaysText);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDaysText} is not a number`);
  const parsedMaximum = Number(view.maximum);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximum} is not a number`);
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  return parsedWindowDays + parsedMaximum + parsedAmount;
}
