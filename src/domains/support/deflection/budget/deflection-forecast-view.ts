import * as text from "../../../../kit/text.js";
import { DeflectionForecast } from "./deflection-forecast.js";

/** How screens and exports show a deflection forecast. */
export class DeflectionForecastView {
  code: string;
  name: string;
  category: string;
  externalRef: string;
  variantText: string;
  conversionRate: string;
  archivedText: string;
  ownerId: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    category: string,
    externalRef: string,
    variantText: string,
    conversionRate: string,
    archivedText: string,
    ownerId: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.category = category;
    this.externalRef = externalRef;
    this.variantText = variantText;
    this.conversionRate = conversionRate;
    this.archivedText = archivedText;
    this.ownerId = ownerId;
    this.statusLabel = statusLabel;
  }
}

export function toDeflectionForecastView(item: DeflectionForecast): DeflectionForecastView {
  return new DeflectionForecastView(
    text.truncate(item.code, 80),
    item.name,
    item.category,
    item.externalRef,
    item.variant,
    item.conversionRate.toFixed(2),
    `${item.archived}`,
    text.truncate(item.ownerId, 120),
    `${item.status}`.toUpperCase(),
  );
}

export function toDeflectionForecastViews(items: DeflectionForecast[]): DeflectionForecastView[] {
  const views: DeflectionForecastView[] = [];
  for (const item of items) {
    views.push(toDeflectionForecastView(item));
  }
  return views;
}

export function sumDeflectionForecastView(view: DeflectionForecastView): number {
  const parsedConversionRate = Number(view.conversionRate);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRate} is not a number`);
  return parsedConversionRate;
}
