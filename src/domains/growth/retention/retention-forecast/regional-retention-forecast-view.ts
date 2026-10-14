import { RegionalRetentionForecast } from "./regional-retention-forecast.js";

/** How screens and exports show a regional retention forecast. */
export class RegionalRetentionForecastView {
  code: string;
  label: string;
  weight: string;
  campaignRef: string;
  contactEmail: string;
  cost: string;
  openRateText: string;
  versionText: string;
  floorValue: string;
  expiresAtText: string;
  locale: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    weight: string,
    campaignRef: string,
    contactEmail: string,
    cost: string,
    openRateText: string,
    versionText: string,
    floorValue: string,
    expiresAtText: string,
    locale: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.weight = weight;
    this.campaignRef = campaignRef;
    this.contactEmail = contactEmail;
    this.cost = cost;
    this.openRateText = openRateText;
    this.versionText = versionText;
    this.floorValue = floorValue;
    this.expiresAtText = expiresAtText;
    this.locale = locale;
    this.statusLabel = statusLabel;
  }
}

export function toRegionalRetentionForecastView(item: RegionalRetentionForecast): RegionalRetentionForecastView {
  return new RegionalRetentionForecastView(
    item.code,
    item.label,
    item.weight.toFixed(2),
    item.campaignRef,
    item.contactEmail,
    item.cost.toFixed(2),
    item.openRate.toFixed(2),
    String(item.version),
    item.floorValue.toFixed(2),
    String(item.expiresAt),
    item.locale,
    `${item.status}`.toUpperCase(),
  );
}

export function toRegionalRetentionForecastViews(items: RegionalRetentionForecast[]): RegionalRetentionForecastView[] {
  const views: RegionalRetentionForecastView[] = [];
  for (const item of items) {
    views.push(toRegionalRetentionForecastView(item));
  }
  return views;
}

export function sumRegionalRetentionForecastView(view: RegionalRetentionForecastView): number {
  const parsedWeight = Number(view.weight);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weight} is not a number`);
  const parsedCost = Number(view.cost);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.cost} is not a number`);
  const parsedOpenRate = Number(view.openRateText);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRateText} is not a number`);
  return parsedWeight + parsedCost + parsedOpenRate;
}
