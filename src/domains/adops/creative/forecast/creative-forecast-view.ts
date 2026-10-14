import * as text from "../../../../kit/text.js";
import { CreativeForecast } from "./creative-forecast.js";

/** How screens and exports show a creative forecast. */
export class CreativeForecastView {
  code: string;
  name: string;
  approved: string;
  openRate: string;
  utmSource: string;
  limit: string;
  revisionText: string;
  journeyId: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    approved: string,
    openRate: string,
    utmSource: string,
    limit: string,
    revisionText: string,
    journeyId: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.approved = approved;
    this.openRate = openRate;
    this.utmSource = utmSource;
    this.limit = limit;
    this.revisionText = revisionText;
    this.journeyId = journeyId;
    this.statusLabel = statusLabel;
  }
}

export function toCreativeForecastView(item: CreativeForecast): CreativeForecastView {
  return new CreativeForecastView(
    item.code,
    item.name,
    `${item.approved}`,
    item.openRate.toFixed(2),
    text.truncate(item.utmSource, 80),
    String(item.limit),
    String(item.revision),
    item.journeyId,
    `${item.status}`.toUpperCase(),
  );
}

export function toCreativeForecastViews(items: CreativeForecast[]): CreativeForecastView[] {
  const views: CreativeForecastView[] = [];
  for (const item of items) {
    views.push(toCreativeForecastView(item));
  }
  return views;
}

export function sumCreativeForecastView(view: CreativeForecastView): number {
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  const parsedLimit = Number(view.limit);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limit} is not a number`);
  const parsedRevision = Number(view.revisionText);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revisionText} is not a number`);
  return parsedOpenRate + parsedLimit + parsedRevision;
}
