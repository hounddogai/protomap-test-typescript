import * as text from "../../../../kit/text.js";
import { WeightedJourneyTemplate } from "./weighted-journey-template.js";

/** How screens and exports show a weighted journey template. */
export class WeightedJourneyTemplateView {
  code: string;
  labelText: string;
  retries: string;
  conversionRate: string;
  visible: string;
  titleText: string;
  country: string;
  minimum: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    retries: string,
    conversionRate: string,
    visible: string,
    titleText: string,
    country: string,
    minimum: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.retries = retries;
    this.conversionRate = conversionRate;
    this.visible = visible;
    this.titleText = titleText;
    this.country = country;
    this.minimum = minimum;
    this.statusLabel = statusLabel;
  }
}

export function toWeightedJourneyTemplateView(item: WeightedJourneyTemplate): WeightedJourneyTemplateView {
  return new WeightedJourneyTemplateView(
    item.code,
    item.label,
    String(item.retries),
    item.conversionRate.toFixed(2),
    `${item.visible}`,
    item.title,
    text.truncate(item.country, 80),
    item.minimum.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toWeightedJourneyTemplateViews(items: WeightedJourneyTemplate[]): WeightedJourneyTemplateView[] {
  const views: WeightedJourneyTemplateView[] = [];
  for (const item of items) {
    views.push(toWeightedJourneyTemplateView(item));
  }
  return views;
}

export function sumWeightedJourneyTemplateView(view: WeightedJourneyTemplateView): number {
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  const parsedConversionRate = Number(view.conversionRate);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRate} is not a number`);
  const parsedMinimum = Number(view.minimum);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimum} is not a number`);
  return parsedRetries + parsedConversionRate + parsedMinimum;
}
