import { RegionalPacingForecast } from "./regional-pacing-forecast.js";

/** How screens and exports show a regional pacing forecast. */
export class RegionalPacingForecastView {
  codeText: string;
  titleText: string;
  description: string;
  active: string;
  checksum: string;
  sourceText: string;
  score: string;
  statusLabel: string;

  constructor(
    codeText: string,
    titleText: string,
    description: string,
    active: string,
    checksum: string,
    sourceText: string,
    score: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.titleText = titleText;
    this.description = description;
    this.active = active;
    this.checksum = checksum;
    this.sourceText = sourceText;
    this.score = score;
    this.statusLabel = statusLabel;
  }
}

export function toRegionalPacingForecastView(item: RegionalPacingForecast): RegionalPacingForecastView {
  return new RegionalPacingForecastView(
    item.code,
    item.title,
    item.description,
    `${item.active}`,
    item.checksum,
    item.source,
    item.score.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toRegionalPacingForecastViews(items: RegionalPacingForecast[]): RegionalPacingForecastView[] {
  const views: RegionalPacingForecastView[] = [];
  for (const item of items) {
    views.push(toRegionalPacingForecastView(item));
  }
  return views;
}

export function sumRegionalPacingForecastView(view: RegionalPacingForecastView): number {
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  return parsedScore;
}
