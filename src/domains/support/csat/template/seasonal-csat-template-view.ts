import * as text from "../../../../kit/text.js";
import { SeasonalCsatTemplate } from "./seasonal-csat-template.js";

/** How screens and exports show a seasonal csat template. */
export class SeasonalCsatTemplateView {
  code: string;
  label: string;
  journeyId: string;
  notes: string;
  countryText: string;
  weightText: string;
  conversionRateText: string;
  rateText: string;
  localeText: string;
  visible: string;
  floorValue: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    journeyId: string,
    notes: string,
    countryText: string,
    weightText: string,
    conversionRateText: string,
    rateText: string,
    localeText: string,
    visible: string,
    floorValue: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.journeyId = journeyId;
    this.notes = notes;
    this.countryText = countryText;
    this.weightText = weightText;
    this.conversionRateText = conversionRateText;
    this.rateText = rateText;
    this.localeText = localeText;
    this.visible = visible;
    this.floorValue = floorValue;
    this.statusLabel = statusLabel;
  }
}

export function toSeasonalCsatTemplateView(item: SeasonalCsatTemplate): SeasonalCsatTemplateView {
  return new SeasonalCsatTemplateView(
    item.code,
    item.label,
    item.journeyId,
    item.notes,
    item.country,
    item.weight.toFixed(2),
    item.conversionRate.toFixed(2),
    item.rate.toFixed(2),
    text.truncate(item.locale, 64),
    `${item.visible}`,
    item.floorValue.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toSeasonalCsatTemplateViews(items: SeasonalCsatTemplate[]): SeasonalCsatTemplateView[] {
  const views: SeasonalCsatTemplateView[] = [];
  for (const item of items) {
    views.push(toSeasonalCsatTemplateView(item));
  }
  return views;
}

export function sumSeasonalCsatTemplateView(view: SeasonalCsatTemplateView): number {
  const parsedWeight = Number(view.weightText);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weightText} is not a number`);
  const parsedConversionRate = Number(view.conversionRateText);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRateText} is not a number`);
  const parsedRate = Number(view.rateText);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rateText} is not a number`);
  return parsedWeight + parsedConversionRate + parsedRate;
}
