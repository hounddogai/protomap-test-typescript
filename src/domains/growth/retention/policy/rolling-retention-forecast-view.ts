import { RollingRetentionForecast } from "./rolling-retention-forecast.js";

/** How screens and exports show a rolling retention forecast. */
export class RollingRetentionForecastView {
  code: string;
  label: string;
  budget: string;
  impressionsText: string;
  revision: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    budget: string,
    impressionsText: string,
    revision: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.budget = budget;
    this.impressionsText = impressionsText;
    this.revision = revision;
    this.statusLabel = statusLabel;
  }
}

export function toRollingRetentionForecastView(item: RollingRetentionForecast): RollingRetentionForecastView {
  return new RollingRetentionForecastView(
    item.code,
    item.label,
    item.budget.toFixed(2),
    String(item.impressions),
    String(item.revision),
    `${item.status}`.toUpperCase(),
  );
}

export function toRollingRetentionForecastViews(items: RollingRetentionForecast[]): RollingRetentionForecastView[] {
  const views: RollingRetentionForecastView[] = [];
  for (const item of items) {
    views.push(toRollingRetentionForecastView(item));
  }
  return views;
}

export function sumRollingRetentionForecastView(view: RollingRetentionForecastView): number {
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedImpressions = Number(view.impressionsText);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressionsText} is not a number`);
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  return parsedBudget + parsedImpressions + parsedRevision;
}
