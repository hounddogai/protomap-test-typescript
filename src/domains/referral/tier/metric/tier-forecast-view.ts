import { TierForecast } from "./tier-forecast.js";

/** How screens and exports show a tier forecast. */
export class TierForecastView {
  codeText: string;
  labelText: string;
  attempts: string;
  retries: string;
  createdAtText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    labelText: string,
    attempts: string,
    retries: string,
    createdAtText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.labelText = labelText;
    this.attempts = attempts;
    this.retries = retries;
    this.createdAtText = createdAtText;
    this.statusLabel = statusLabel;
  }
}

export function toTierForecastView(item: TierForecast): TierForecastView {
  return new TierForecastView(
    item.code,
    item.label,
    String(item.attempts),
    String(item.retries),
    String(item.createdAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toTierForecastViews(items: TierForecast[]): TierForecastView[] {
  const views: TierForecastView[] = [];
  for (const item of items) {
    views.push(toTierForecastView(item));
  }
  return views;
}

export function sumTierForecastView(view: TierForecastView): number {
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  const parsedCreatedAt = Number(view.createdAtText);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAtText} is not a number`);
  return parsedAttempts + parsedRetries + parsedCreatedAt;
}
