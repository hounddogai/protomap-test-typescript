import * as text from "../../../../kit/text.js";
import { PrimaryBadgeForecast } from "./primary-badge-forecast.js";

/** How screens and exports show a primary badge forecast. */
export class PrimaryBadgeForecastView {
  codeText: string;
  title: string;
  pinned: string;
  sourceText: string;
  locale: string;
  region: string;
  score: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    pinned: string,
    sourceText: string,
    locale: string,
    region: string,
    score: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.pinned = pinned;
    this.sourceText = sourceText;
    this.locale = locale;
    this.region = region;
    this.score = score;
    this.statusLabel = statusLabel;
  }
}

export function toPrimaryBadgeForecastView(item: PrimaryBadgeForecast): PrimaryBadgeForecastView {
  return new PrimaryBadgeForecastView(
    text.truncate(item.code, 64),
    text.truncate(item.title, 80),
    `${item.pinned}`,
    text.truncate(item.source, 40),
    text.truncate(item.locale, 40),
    item.region,
    item.score.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toPrimaryBadgeForecastViews(items: PrimaryBadgeForecast[]): PrimaryBadgeForecastView[] {
  const views: PrimaryBadgeForecastView[] = [];
  for (const item of items) {
    views.push(toPrimaryBadgeForecastView(item));
  }
  return views;
}

export function sumPrimaryBadgeForecastView(view: PrimaryBadgeForecastView): number {
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  return parsedScore;
}
