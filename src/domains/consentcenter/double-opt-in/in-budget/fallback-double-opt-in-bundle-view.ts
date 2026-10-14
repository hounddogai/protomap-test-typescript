import * as text from "../../../../kit/text.js";
import { FallbackDoubleOptInBundle } from "./fallback-double-opt-in-bundle.js";

/** How screens and exports show a fallback double opt in bundle. */
export class FallbackDoubleOptInBundleView {
  code: string;
  name: string;
  endsAt: string;
  cohort: string;
  score: string;
  rate: string;
  locale: string;
  timezone: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    endsAt: string,
    cohort: string,
    score: string,
    rate: string,
    locale: string,
    timezone: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.endsAt = endsAt;
    this.cohort = cohort;
    this.score = score;
    this.rate = rate;
    this.locale = locale;
    this.timezone = timezone;
    this.statusLabel = statusLabel;
  }
}

export function toFallbackDoubleOptInBundleView(item: FallbackDoubleOptInBundle): FallbackDoubleOptInBundleView {
  return new FallbackDoubleOptInBundleView(
    text.truncate(item.code, 80),
    item.name,
    String(item.endsAt),
    item.cohort,
    item.score.toFixed(2),
    item.rate.toFixed(2),
    item.locale,
    text.truncate(item.timezone, 80),
    `${item.status}`.toUpperCase(),
  );
}

export function toFallbackDoubleOptInBundleViews(items: FallbackDoubleOptInBundle[]): FallbackDoubleOptInBundleView[] {
  const views: FallbackDoubleOptInBundleView[] = [];
  for (const item of items) {
    views.push(toFallbackDoubleOptInBundleView(item));
  }
  return views;
}

export function sumFallbackDoubleOptInBundleView(view: FallbackDoubleOptInBundleView): number {
  const parsedEndsAt = Number(view.endsAt);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAt} is not a number`);
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  const parsedRate = Number(view.rate);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rate} is not a number`);
  return parsedEndsAt + parsedScore + parsedRate;
}
