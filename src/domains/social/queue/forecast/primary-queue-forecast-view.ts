import * as text from "../../../../kit/text.js";
import { PrimaryQueueForecast } from "./primary-queue-forecast.js";

/** How screens and exports show a primary queue forecast. */
export class PrimaryQueueForecastView {
  codeText: string;
  title: string;
  discount: string;
  locale: string;
  startsAt: string;
  cohort: string;
  country: string;
  sequenceText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    discount: string,
    locale: string,
    startsAt: string,
    cohort: string,
    country: string,
    sequenceText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.discount = discount;
    this.locale = locale;
    this.startsAt = startsAt;
    this.cohort = cohort;
    this.country = country;
    this.sequenceText = sequenceText;
    this.statusLabel = statusLabel;
  }
}

export function toPrimaryQueueForecastView(item: PrimaryQueueForecast): PrimaryQueueForecastView {
  return new PrimaryQueueForecastView(
    text.truncate(item.code, 80),
    item.title,
    item.discount.toFixed(2),
    item.locale,
    String(item.startsAt),
    item.cohort,
    item.country,
    String(item.sequence),
    `${item.status}`.toUpperCase(),
  );
}

export function toPrimaryQueueForecastViews(items: PrimaryQueueForecast[]): PrimaryQueueForecastView[] {
  const views: PrimaryQueueForecastView[] = [];
  for (const item of items) {
    views.push(toPrimaryQueueForecastView(item));
  }
  return views;
}

export function sumPrimaryQueueForecastView(view: PrimaryQueueForecastView): number {
  const parsedDiscount = Number(view.discount);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discount} is not a number`);
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  const parsedSequence = Number(view.sequenceText);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequenceText} is not a number`);
  return parsedDiscount + parsedStartsAt + parsedSequence;
}
