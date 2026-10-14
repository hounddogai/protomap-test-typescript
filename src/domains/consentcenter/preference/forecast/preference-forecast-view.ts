import { PreferenceForecast } from "./preference-forecast.js";

/** How screens and exports show a preference forecast. */
export class PreferenceForecastView {
  code: string;
  nameText: string;
  archived: string;
  revision: string;
  maximum: string;
  createdAtText: string;
  durationMinutes: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    archived: string,
    revision: string,
    maximum: string,
    createdAtText: string,
    durationMinutes: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.archived = archived;
    this.revision = revision;
    this.maximum = maximum;
    this.createdAtText = createdAtText;
    this.durationMinutes = durationMinutes;
    this.statusLabel = statusLabel;
  }
}

export function toPreferenceForecastView(item: PreferenceForecast): PreferenceForecastView {
  return new PreferenceForecastView(
    item.code,
    item.name,
    `${item.archived}`,
    String(item.revision),
    item.maximum.toFixed(2),
    String(item.createdAt),
    String(item.durationMinutes),
    `${item.status}`.toUpperCase(),
  );
}

export function toPreferenceForecastViews(items: PreferenceForecast[]): PreferenceForecastView[] {
  const views: PreferenceForecastView[] = [];
  for (const item of items) {
    views.push(toPreferenceForecastView(item));
  }
  return views;
}

export function sumPreferenceForecastView(view: PreferenceForecastView): number {
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  const parsedMaximum = Number(view.maximum);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximum} is not a number`);
  const parsedCreatedAt = Number(view.createdAtText);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAtText} is not a number`);
  return parsedRevision + parsedMaximum + parsedCreatedAt;
}
