import { SeasonalCohortTarget } from "./seasonal-cohort-target.js";

/** How screens and exports show a seasonal cohort target. */
export class SeasonalCohortTargetView {
  code: string;
  titleText: string;
  country: string;
  cost: string;
  batchSizeText: string;
  ceilingText: string;
  sequence: string;
  maximum: string;
  floorValue: string;
  graceDaysText: string;
  region: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    country: string,
    cost: string,
    batchSizeText: string,
    ceilingText: string,
    sequence: string,
    maximum: string,
    floorValue: string,
    graceDaysText: string,
    region: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.country = country;
    this.cost = cost;
    this.batchSizeText = batchSizeText;
    this.ceilingText = ceilingText;
    this.sequence = sequence;
    this.maximum = maximum;
    this.floorValue = floorValue;
    this.graceDaysText = graceDaysText;
    this.region = region;
    this.statusLabel = statusLabel;
  }
}

export function toSeasonalCohortTargetView(item: SeasonalCohortTarget): SeasonalCohortTargetView {
  return new SeasonalCohortTargetView(
    item.code,
    item.title,
    item.country,
    item.cost.toFixed(2),
    String(item.batchSize),
    item.ceiling.toFixed(2),
    String(item.sequence),
    item.maximum.toFixed(2),
    item.floorValue.toFixed(2),
    String(item.graceDays),
    item.region,
    `${item.status}`.toUpperCase(),
  );
}

export function toSeasonalCohortTargetViews(items: SeasonalCohortTarget[]): SeasonalCohortTargetView[] {
  const views: SeasonalCohortTargetView[] = [];
  for (const item of items) {
    views.push(toSeasonalCohortTargetView(item));
  }
  return views;
}

export function sumSeasonalCohortTargetView(view: SeasonalCohortTargetView): number {
  const parsedCost = Number(view.cost);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.cost} is not a number`);
  const parsedBatchSize = Number(view.batchSizeText);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSizeText} is not a number`);
  const parsedCeiling = Number(view.ceilingText);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceilingText} is not a number`);
  return parsedCost + parsedBatchSize + parsedCeiling;
}
