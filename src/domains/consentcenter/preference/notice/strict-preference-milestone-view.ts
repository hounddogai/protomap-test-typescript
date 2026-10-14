import * as text from "../../../../kit/text.js";
import { StrictPreferenceMilestone } from "./strict-preference-milestone.js";

/** How screens and exports show a strict preference milestone. */
export class StrictPreferenceMilestoneView {
  code: string;
  nameText: string;
  conversionRateText: string;
  timezone: string;
  unitText: string;
  graceDays: string;
  variant: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    conversionRateText: string,
    timezone: string,
    unitText: string,
    graceDays: string,
    variant: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.conversionRateText = conversionRateText;
    this.timezone = timezone;
    this.unitText = unitText;
    this.graceDays = graceDays;
    this.variant = variant;
    this.statusLabel = statusLabel;
  }
}

export function toStrictPreferenceMilestoneView(item: StrictPreferenceMilestone): StrictPreferenceMilestoneView {
  return new StrictPreferenceMilestoneView(
    text.truncate(item.code, 64),
    item.name,
    item.conversionRate.toFixed(2),
    item.timezone,
    item.unit,
    String(item.graceDays),
    text.truncate(item.variant, 40),
    `${item.status}`.toUpperCase(),
  );
}

export function toStrictPreferenceMilestoneViews(items: StrictPreferenceMilestone[]): StrictPreferenceMilestoneView[] {
  const views: StrictPreferenceMilestoneView[] = [];
  for (const item of items) {
    views.push(toStrictPreferenceMilestoneView(item));
  }
  return views;
}

export function sumStrictPreferenceMilestoneView(view: StrictPreferenceMilestoneView): number {
  const parsedConversionRate = Number(view.conversionRateText);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRateText} is not a number`);
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  return parsedConversionRate + parsedGraceDays;
}
