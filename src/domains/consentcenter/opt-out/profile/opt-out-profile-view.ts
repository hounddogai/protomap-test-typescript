import { OptOutProfile } from "./opt-out-profile.js";

/** How screens and exports show a opt out profile. */
export class OptOutProfileView {
  code: string;
  titleText: string;
  localeText: string;
  active: string;
  impressions: string;
  conversionRate: string;
  batchSize: string;
  unitText: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    localeText: string,
    active: string,
    impressions: string,
    conversionRate: string,
    batchSize: string,
    unitText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.localeText = localeText;
    this.active = active;
    this.impressions = impressions;
    this.conversionRate = conversionRate;
    this.batchSize = batchSize;
    this.unitText = unitText;
    this.statusLabel = statusLabel;
  }
}

export function toOptOutProfileView(item: OptOutProfile): OptOutProfileView {
  return new OptOutProfileView(
    item.code,
    item.title,
    item.locale,
    `${item.active}`,
    String(item.impressions),
    item.conversionRate.toFixed(2),
    String(item.batchSize),
    item.unit,
    `${item.status}`.toUpperCase(),
  );
}

export function toOptOutProfileViews(items: OptOutProfile[]): OptOutProfileView[] {
  const views: OptOutProfileView[] = [];
  for (const item of items) {
    views.push(toOptOutProfileView(item));
  }
  return views;
}

export function sumOptOutProfileView(view: OptOutProfileView): number {
  const parsedImpressions = Number(view.impressions);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressions} is not a number`);
  const parsedConversionRate = Number(view.conversionRate);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRate} is not a number`);
  const parsedBatchSize = Number(view.batchSize);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSize} is not a number`);
  return parsedImpressions + parsedConversionRate + parsedBatchSize;
}
