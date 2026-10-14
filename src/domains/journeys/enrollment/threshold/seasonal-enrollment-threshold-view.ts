import * as text from "../../../../kit/text.js";
import { SeasonalEnrollmentThreshold } from "./seasonal-enrollment-threshold.js";

/** How screens and exports show a seasonal enrollment threshold. */
export class SeasonalEnrollmentThresholdView {
  code: string;
  label: string;
  budget: string;
  campaignRef: string;
  region: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    budget: string,
    campaignRef: string,
    region: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.budget = budget;
    this.campaignRef = campaignRef;
    this.region = region;
    this.statusLabel = statusLabel;
  }
}

export function toSeasonalEnrollmentThresholdView(item: SeasonalEnrollmentThreshold): SeasonalEnrollmentThresholdView {
  return new SeasonalEnrollmentThresholdView(
    text.truncate(item.code, 64),
    item.label,
    item.budget.toFixed(2),
    item.campaignRef,
    item.region,
    `${item.status}`.toUpperCase(),
  );
}

export function toSeasonalEnrollmentThresholdViews(items: SeasonalEnrollmentThreshold[]): SeasonalEnrollmentThresholdView[] {
  const views: SeasonalEnrollmentThresholdView[] = [];
  for (const item of items) {
    views.push(toSeasonalEnrollmentThresholdView(item));
  }
  return views;
}

export function sumSeasonalEnrollmentThresholdView(view: SeasonalEnrollmentThresholdView): number {
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  return parsedBudget;
}
