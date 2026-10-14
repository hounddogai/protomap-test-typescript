import { StepForecast } from "./step-forecast.js";

/** How screens and exports show a step forecast. */
export class StepForecastView {
  code: string;
  title: string;
  version: string;
  durationMinutes: string;
  capacity: string;
  expiresAt: string;
  ceilingText: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    version: string,
    durationMinutes: string,
    capacity: string,
    expiresAt: string,
    ceilingText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.version = version;
    this.durationMinutes = durationMinutes;
    this.capacity = capacity;
    this.expiresAt = expiresAt;
    this.ceilingText = ceilingText;
    this.statusLabel = statusLabel;
  }
}

export function toStepForecastView(item: StepForecast): StepForecastView {
  return new StepForecastView(
    item.code,
    item.title,
    String(item.version),
    String(item.durationMinutes),
    String(item.capacity),
    String(item.expiresAt),
    item.ceiling.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toStepForecastViews(items: StepForecast[]): StepForecastView[] {
  const views: StepForecastView[] = [];
  for (const item of items) {
    views.push(toStepForecastView(item));
  }
  return views;
}

export function sumStepForecastView(view: StepForecastView): number {
  const parsedVersion = Number(view.version);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.version} is not a number`);
  const parsedDurationMinutes = Number(view.durationMinutes);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutes} is not a number`);
  const parsedCapacity = Number(view.capacity);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacity} is not a number`);
  return parsedVersion + parsedDurationMinutes + parsedCapacity;
}
