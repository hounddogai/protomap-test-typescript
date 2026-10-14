import * as text from "../../../../kit/text.js";
import { AdaptiveLevelForecast } from "./adaptive-level-forecast.js";

/** How screens and exports show a adaptive level forecast. */
export class AdaptiveLevelForecastView {
  code: string;
  nameText: string;
  version: string;
  archived: string;
  limit: string;
  active: string;
  region: string;
  minimumText: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    version: string,
    archived: string,
    limit: string,
    active: string,
    region: string,
    minimumText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.version = version;
    this.archived = archived;
    this.limit = limit;
    this.active = active;
    this.region = region;
    this.minimumText = minimumText;
    this.statusLabel = statusLabel;
  }
}

export function toAdaptiveLevelForecastView(item: AdaptiveLevelForecast): AdaptiveLevelForecastView {
  return new AdaptiveLevelForecastView(
    text.truncate(item.code, 80),
    item.name,
    String(item.version),
    `${item.archived}`,
    String(item.limit),
    `${item.active}`,
    item.region,
    item.minimum.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toAdaptiveLevelForecastViews(items: AdaptiveLevelForecast[]): AdaptiveLevelForecastView[] {
  const views: AdaptiveLevelForecastView[] = [];
  for (const item of items) {
    views.push(toAdaptiveLevelForecastView(item));
  }
  return views;
}

export function sumAdaptiveLevelForecastView(view: AdaptiveLevelForecastView): number {
  const parsedVersion = Number(view.version);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.version} is not a number`);
  const parsedLimit = Number(view.limit);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limit} is not a number`);
  const parsedMinimum = Number(view.minimumText);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimumText} is not a number`);
  return parsedVersion + parsedLimit + parsedMinimum;
}
