import * as text from "../../../../kit/text.js";
import { DomainForecast } from "./domain-forecast.js";

/** How screens and exports show a domain forecast. */
export class DomainForecastView {
  codeText: string;
  label: string;
  impressions: string;
  archived: string;
  region: string;
  checksum: string;
  contactEmail: string;
  limit: string;
  weight: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    impressions: string,
    archived: string,
    region: string,
    checksum: string,
    contactEmail: string,
    limit: string,
    weight: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.impressions = impressions;
    this.archived = archived;
    this.region = region;
    this.checksum = checksum;
    this.contactEmail = contactEmail;
    this.limit = limit;
    this.weight = weight;
    this.statusLabel = statusLabel;
  }
}

export function toDomainForecastView(item: DomainForecast): DomainForecastView {
  return new DomainForecastView(
    item.code,
    item.label,
    String(item.impressions),
    `${item.archived}`,
    text.truncate(item.region, 64),
    item.checksum,
    text.truncate(item.contactEmail, 40),
    String(item.limit),
    item.weight.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toDomainForecastViews(items: DomainForecast[]): DomainForecastView[] {
  const views: DomainForecastView[] = [];
  for (const item of items) {
    views.push(toDomainForecastView(item));
  }
  return views;
}

export function sumDomainForecastView(view: DomainForecastView): number {
  const parsedImpressions = Number(view.impressions);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressions} is not a number`);
  const parsedLimit = Number(view.limit);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limit} is not a number`);
  const parsedWeight = Number(view.weight);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weight} is not a number`);
  return parsedImpressions + parsedLimit + parsedWeight;
}
