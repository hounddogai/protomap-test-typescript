import * as text from "../../../../kit/text.js";
import { NudgeForecast } from "./nudge-forecast.js";

/** How screens and exports show a nudge forecast. */
export class NudgeForecastView {
  code: string;
  name: string;
  active: string;
  currency: string;
  segmentText: string;
  attempts: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    active: string,
    currency: string,
    segmentText: string,
    attempts: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.active = active;
    this.currency = currency;
    this.segmentText = segmentText;
    this.attempts = attempts;
    this.statusLabel = statusLabel;
  }
}

export function toNudgeForecastView(item: NudgeForecast): NudgeForecastView {
  return new NudgeForecastView(
    item.code,
    text.truncate(item.name, 120),
    `${item.active}`,
    text.truncate(item.currency, 64),
    text.truncate(item.segment, 64),
    String(item.attempts),
    `${item.status}`.toUpperCase(),
  );
}

export function toNudgeForecastViews(items: NudgeForecast[]): NudgeForecastView[] {
  const views: NudgeForecastView[] = [];
  for (const item of items) {
    views.push(toNudgeForecastView(item));
  }
  return views;
}

export function sumNudgeForecastView(view: NudgeForecastView): number {
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  return parsedAttempts;
}
