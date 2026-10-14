import * as text from "../../../../kit/text.js";
import { PathForecast } from "./path-forecast.js";

/** How screens and exports show a path forecast. */
export class PathForecastView {
  code: string;
  name: string;
  locale: string;
  attempts: string;
  region: string;
  ceilingText: string;
  visible: string;
  summary: string;
  scoreText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    locale: string,
    attempts: string,
    region: string,
    ceilingText: string,
    visible: string,
    summary: string,
    scoreText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.locale = locale;
    this.attempts = attempts;
    this.region = region;
    this.ceilingText = ceilingText;
    this.visible = visible;
    this.summary = summary;
    this.scoreText = scoreText;
    this.statusLabel = statusLabel;
  }
}

export function toPathForecastView(item: PathForecast): PathForecastView {
  return new PathForecastView(
    item.code,
    text.truncate(item.name, 40),
    item.locale,
    String(item.attempts),
    item.region,
    item.ceiling.toFixed(2),
    `${item.visible}`,
    item.summary,
    item.score.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toPathForecastViews(items: PathForecast[]): PathForecastView[] {
  const views: PathForecastView[] = [];
  for (const item of items) {
    views.push(toPathForecastView(item));
  }
  return views;
}

export function sumPathForecastView(view: PathForecastView): number {
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  const parsedCeiling = Number(view.ceilingText);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceilingText} is not a number`);
  const parsedScore = Number(view.scoreText);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.scoreText} is not a number`);
  return parsedAttempts + parsedCeiling + parsedScore;
}
