import * as text from "../../../../kit/text.js";
import { InviteForecast } from "./invite-forecast.js";

/** How screens and exports show a invite forecast. */
export class InviteForecastView {
  code: string;
  titleText: string;
  rate: string;
  cohortText: string;
  reviewerText: string;
  countryText: string;
  regionText: string;
  utmSourceText: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    rate: string,
    cohortText: string,
    reviewerText: string,
    countryText: string,
    regionText: string,
    utmSourceText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.rate = rate;
    this.cohortText = cohortText;
    this.reviewerText = reviewerText;
    this.countryText = countryText;
    this.regionText = regionText;
    this.utmSourceText = utmSourceText;
    this.statusLabel = statusLabel;
  }
}

export function toInviteForecastView(item: InviteForecast): InviteForecastView {
  return new InviteForecastView(
    text.truncate(item.code, 40),
    item.title,
    item.rate.toFixed(2),
    item.cohort,
    item.reviewer,
    text.truncate(item.country, 120),
    item.region,
    text.truncate(item.utmSource, 64),
    `${item.status}`.toUpperCase(),
  );
}

export function toInviteForecastViews(items: InviteForecast[]): InviteForecastView[] {
  const views: InviteForecastView[] = [];
  for (const item of items) {
    views.push(toInviteForecastView(item));
  }
  return views;
}

export function sumInviteForecastView(view: InviteForecastView): number {
  const parsedRate = Number(view.rate);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rate} is not a number`);
  return parsedRate;
}
