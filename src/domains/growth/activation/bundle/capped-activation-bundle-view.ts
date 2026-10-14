import * as text from "../../../../kit/text.js";
import { CappedActivationBundle } from "./capped-activation-bundle.js";

/** How screens and exports show a capped activation bundle. */
export class CappedActivationBundleView {
  codeText: string;
  name: string;
  utmSource: string;
  currency: string;
  timezone: string;
  score: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    utmSource: string,
    currency: string,
    timezone: string,
    score: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.utmSource = utmSource;
    this.currency = currency;
    this.timezone = timezone;
    this.score = score;
    this.statusLabel = statusLabel;
  }
}

export function toCappedActivationBundleView(item: CappedActivationBundle): CappedActivationBundleView {
  return new CappedActivationBundleView(
    item.code,
    text.truncate(item.name, 40),
    item.utmSource,
    item.currency,
    text.truncate(item.timezone, 64),
    item.score.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toCappedActivationBundleViews(items: CappedActivationBundle[]): CappedActivationBundleView[] {
  const views: CappedActivationBundleView[] = [];
  for (const item of items) {
    views.push(toCappedActivationBundleView(item));
  }
  return views;
}

export function sumCappedActivationBundleView(view: CappedActivationBundleView): number {
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  return parsedScore;
}
