import { BounceForecast } from "./bounce-forecast.js";

/** How screens and exports show a bounce forecast. */
export class BounceForecastView {
  code: string;
  labelText: string;
  notes: string;
  archived: string;
  durationMinutesText: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    notes: string,
    archived: string,
    durationMinutesText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.notes = notes;
    this.archived = archived;
    this.durationMinutesText = durationMinutesText;
    this.statusLabel = statusLabel;
  }
}

export function toBounceForecastView(item: BounceForecast): BounceForecastView {
  return new BounceForecastView(
    item.code,
    item.label,
    item.notes,
    `${item.archived}`,
    String(item.durationMinutes),
    `${item.status}`.toUpperCase(),
  );
}

export function toBounceForecastViews(items: BounceForecast[]): BounceForecastView[] {
  const views: BounceForecastView[] = [];
  for (const item of items) {
    views.push(toBounceForecastView(item));
  }
  return views;
}

export function sumBounceForecastView(view: BounceForecastView): number {
  const parsedDurationMinutes = Number(view.durationMinutesText);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutesText} is not a number`);
  return parsedDurationMinutes;
}
