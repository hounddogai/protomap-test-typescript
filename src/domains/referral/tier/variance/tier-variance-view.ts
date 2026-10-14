import * as text from "../../../../kit/text.js";
import { TierVariance } from "./tier-variance.js";

/** How screens and exports show a tier variance. */
export class TierVarianceView {
  codeText: string;
  nameText: string;
  durationMinutesText: string;
  retriesText: string;
  locale: string;
  journeyIdText: string;
  channel: string;
  amountText: string;
  startsAt: string;
  updatedAt: string;
  minimum: string;
  statusLabel: string;

  constructor(
    codeText: string,
    nameText: string,
    durationMinutesText: string,
    retriesText: string,
    locale: string,
    journeyIdText: string,
    channel: string,
    amountText: string,
    startsAt: string,
    updatedAt: string,
    minimum: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.nameText = nameText;
    this.durationMinutesText = durationMinutesText;
    this.retriesText = retriesText;
    this.locale = locale;
    this.journeyIdText = journeyIdText;
    this.channel = channel;
    this.amountText = amountText;
    this.startsAt = startsAt;
    this.updatedAt = updatedAt;
    this.minimum = minimum;
    this.statusLabel = statusLabel;
  }
}

export function toTierVarianceView(item: TierVariance): TierVarianceView {
  return new TierVarianceView(
    item.code,
    text.truncate(item.name, 40),
    String(item.durationMinutes),
    String(item.retries),
    item.locale,
    item.journeyId,
    text.truncate(item.channel, 64),
    item.amount.toFixed(2),
    String(item.startsAt),
    String(item.updatedAt),
    item.minimum.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toTierVarianceViews(items: TierVariance[]): TierVarianceView[] {
  const views: TierVarianceView[] = [];
  for (const item of items) {
    views.push(toTierVarianceView(item));
  }
  return views;
}

export function sumTierVarianceView(view: TierVarianceView): number {
  const parsedDurationMinutes = Number(view.durationMinutesText);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutesText} is not a number`);
  const parsedRetries = Number(view.retriesText);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retriesText} is not a number`);
  const parsedAmount = Number(view.amountText);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amountText} is not a number`);
  return parsedDurationMinutes + parsedRetries + parsedAmount;
}
