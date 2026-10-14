import * as text from "../../../../kit/text.js";
import { GlobalNudgeForecast } from "./global-nudge-forecast.js";

/** How screens and exports show a global nudge forecast. */
export class GlobalNudgeForecastView {
  code: string;
  title: string;
  score: string;
  sequenceText: string;
  limit: string;
  archived: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    score: string,
    sequenceText: string,
    limit: string,
    archived: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.score = score;
    this.sequenceText = sequenceText;
    this.limit = limit;
    this.archived = archived;
    this.statusLabel = statusLabel;
  }
}

export function toGlobalNudgeForecastView(item: GlobalNudgeForecast): GlobalNudgeForecastView {
  return new GlobalNudgeForecastView(
    item.code,
    text.truncate(item.title, 120),
    item.score.toFixed(2),
    String(item.sequence),
    String(item.limit),
    `${item.archived}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toGlobalNudgeForecastViews(items: GlobalNudgeForecast[]): GlobalNudgeForecastView[] {
  const views: GlobalNudgeForecastView[] = [];
  for (const item of items) {
    views.push(toGlobalNudgeForecastView(item));
  }
  return views;
}

export function sumGlobalNudgeForecastView(view: GlobalNudgeForecastView): number {
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  const parsedSequence = Number(view.sequenceText);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequenceText} is not a number`);
  const parsedLimit = Number(view.limit);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limit} is not a number`);
  return parsedScore + parsedSequence + parsedLimit;
}
