import * as text from "../../../../kit/text.js";
import { PendingCreativeForecast } from "./pending-creative-forecast.js";

/** How screens and exports show a pending creative forecast. */
export class PendingCreativeForecastView {
  code: string;
  title: string;
  source: string;
  variant: string;
  ceiling: string;
  notes: string;
  score: string;
  active: string;
  segment: string;
  frequencyCap: string;
  limit: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    source: string,
    variant: string,
    ceiling: string,
    notes: string,
    score: string,
    active: string,
    segment: string,
    frequencyCap: string,
    limit: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.source = source;
    this.variant = variant;
    this.ceiling = ceiling;
    this.notes = notes;
    this.score = score;
    this.active = active;
    this.segment = segment;
    this.frequencyCap = frequencyCap;
    this.limit = limit;
    this.statusLabel = statusLabel;
  }
}

export function toPendingCreativeForecastView(item: PendingCreativeForecast): PendingCreativeForecastView {
  return new PendingCreativeForecastView(
    item.code,
    item.title,
    item.source,
    text.truncate(item.variant, 64),
    item.ceiling.toFixed(2),
    item.notes,
    item.score.toFixed(2),
    `${item.active}`,
    text.truncate(item.segment, 40),
    String(item.frequencyCap),
    String(item.limit),
    `${item.status}`.toUpperCase(),
  );
}

export function toPendingCreativeForecastViews(items: PendingCreativeForecast[]): PendingCreativeForecastView[] {
  const views: PendingCreativeForecastView[] = [];
  for (const item of items) {
    views.push(toPendingCreativeForecastView(item));
  }
  return views;
}

export function sumPendingCreativeForecastView(view: PendingCreativeForecastView): number {
  const parsedCeiling = Number(view.ceiling);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceiling} is not a number`);
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  const parsedFrequencyCap = Number(view.frequencyCap);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCap} is not a number`);
  return parsedCeiling + parsedScore + parsedFrequencyCap;
}
