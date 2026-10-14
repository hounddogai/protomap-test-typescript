import * as text from "../../../../kit/text.js";
import { DefaultRedemptionOverride } from "./default-redemption-override.js";

/** How screens and exports show a default redemption override. */
export class DefaultRedemptionOverrideView {
  codeText: string;
  label: string;
  timezoneText: string;
  ceiling: string;
  notes: string;
  impressions: string;
  variant: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    timezoneText: string,
    ceiling: string,
    notes: string,
    impressions: string,
    variant: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.timezoneText = timezoneText;
    this.ceiling = ceiling;
    this.notes = notes;
    this.impressions = impressions;
    this.variant = variant;
    this.statusLabel = statusLabel;
  }
}

export function toDefaultRedemptionOverrideView(item: DefaultRedemptionOverride): DefaultRedemptionOverrideView {
  return new DefaultRedemptionOverrideView(
    item.code,
    item.label,
    text.truncate(item.timezone, 64),
    item.ceiling.toFixed(2),
    item.notes,
    String(item.impressions),
    item.variant,
    `${item.status}`.toUpperCase(),
  );
}

export function toDefaultRedemptionOverrideViews(items: DefaultRedemptionOverride[]): DefaultRedemptionOverrideView[] {
  const views: DefaultRedemptionOverrideView[] = [];
  for (const item of items) {
    views.push(toDefaultRedemptionOverrideView(item));
  }
  return views;
}

export function sumDefaultRedemptionOverrideView(view: DefaultRedemptionOverrideView): number {
  const parsedCeiling = Number(view.ceiling);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceiling} is not a number`);
  const parsedImpressions = Number(view.impressions);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressions} is not a number`);
  return parsedCeiling + parsedImpressions;
}
