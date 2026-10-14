import * as text from "../../../../kit/text.js";
import { SeasonalRetentionBundle } from "./seasonal-retention-bundle.js";

/** How screens and exports show a seasonal retention bundle. */
export class SeasonalRetentionBundleView {
  code: string;
  name: string;
  budget: string;
  weightText: string;
  phone: string;
  conversionRate: string;
  endsAt: string;
  maximum: string;
  updatedAt: string;
  summaryText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    budget: string,
    weightText: string,
    phone: string,
    conversionRate: string,
    endsAt: string,
    maximum: string,
    updatedAt: string,
    summaryText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.budget = budget;
    this.weightText = weightText;
    this.phone = phone;
    this.conversionRate = conversionRate;
    this.endsAt = endsAt;
    this.maximum = maximum;
    this.updatedAt = updatedAt;
    this.summaryText = summaryText;
    this.statusLabel = statusLabel;
  }
}

export function toSeasonalRetentionBundleView(item: SeasonalRetentionBundle): SeasonalRetentionBundleView {
  return new SeasonalRetentionBundleView(
    item.code,
    text.truncate(item.name, 64),
    item.budget.toFixed(2),
    item.weight.toFixed(2),
    item.phone,
    item.conversionRate.toFixed(2),
    String(item.endsAt),
    item.maximum.toFixed(2),
    String(item.updatedAt),
    item.summary,
    `${item.status}`.toUpperCase(),
  );
}

export function toSeasonalRetentionBundleViews(items: SeasonalRetentionBundle[]): SeasonalRetentionBundleView[] {
  const views: SeasonalRetentionBundleView[] = [];
  for (const item of items) {
    views.push(toSeasonalRetentionBundleView(item));
  }
  return views;
}

export function sumSeasonalRetentionBundleView(view: SeasonalRetentionBundleView): number {
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedWeight = Number(view.weightText);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weightText} is not a number`);
  const parsedConversionRate = Number(view.conversionRate);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRate} is not a number`);
  return parsedBudget + parsedWeight + parsedConversionRate;
}
