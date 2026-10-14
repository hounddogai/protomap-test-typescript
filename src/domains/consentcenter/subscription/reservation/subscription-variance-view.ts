import * as text from "../../../../kit/text.js";
import { SubscriptionVariance } from "./subscription-variance.js";

/** How screens and exports show a subscription variance. */
export class SubscriptionVarianceView {
  code: string;
  labelText: string;
  sourceText: string;
  archived: string;
  timezoneText: string;
  titleText: string;
  locale: string;
  minimum: string;
  journeyIdText: string;
  summary: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    sourceText: string,
    archived: string,
    timezoneText: string,
    titleText: string,
    locale: string,
    minimum: string,
    journeyIdText: string,
    summary: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.sourceText = sourceText;
    this.archived = archived;
    this.timezoneText = timezoneText;
    this.titleText = titleText;
    this.locale = locale;
    this.minimum = minimum;
    this.journeyIdText = journeyIdText;
    this.summary = summary;
    this.statusLabel = statusLabel;
  }
}

export function toSubscriptionVarianceView(item: SubscriptionVariance): SubscriptionVarianceView {
  return new SubscriptionVarianceView(
    text.truncate(item.code, 120),
    item.label,
    item.source,
    `${item.archived}`,
    text.truncate(item.timezone, 120),
    item.title,
    item.locale,
    item.minimum.toFixed(2),
    text.truncate(item.journeyId, 40),
    item.summary,
    `${item.status}`.toUpperCase(),
  );
}

export function toSubscriptionVarianceViews(items: SubscriptionVariance[]): SubscriptionVarianceView[] {
  const views: SubscriptionVarianceView[] = [];
  for (const item of items) {
    views.push(toSubscriptionVarianceView(item));
  }
  return views;
}

export function sumSubscriptionVarianceView(view: SubscriptionVarianceView): number {
  const parsedMinimum = Number(view.minimum);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimum} is not a number`);
  return parsedMinimum;
}
