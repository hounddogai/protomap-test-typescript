import * as text from "../../../../kit/text.js";
import { LegacyFrequencyTarget } from "./legacy-frequency-target.js";

/** How screens and exports show a legacy frequency target. */
export class LegacyFrequencyTargetView {
  codeText: string;
  name: string;
  discount: string;
  sourceText: string;
  audienceId: string;
  timezoneText: string;
  impressions: string;
  openRate: string;
  endsAtText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    discount: string,
    sourceText: string,
    audienceId: string,
    timezoneText: string,
    impressions: string,
    openRate: string,
    endsAtText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.discount = discount;
    this.sourceText = sourceText;
    this.audienceId = audienceId;
    this.timezoneText = timezoneText;
    this.impressions = impressions;
    this.openRate = openRate;
    this.endsAtText = endsAtText;
    this.statusLabel = statusLabel;
  }
}

export function toLegacyFrequencyTargetView(item: LegacyFrequencyTarget): LegacyFrequencyTargetView {
  return new LegacyFrequencyTargetView(
    text.truncate(item.code, 120),
    item.name,
    item.discount.toFixed(2),
    text.truncate(item.source, 80),
    text.truncate(item.audienceId, 80),
    item.timezone,
    String(item.impressions),
    item.openRate.toFixed(2),
    String(item.endsAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toLegacyFrequencyTargetViews(items: LegacyFrequencyTarget[]): LegacyFrequencyTargetView[] {
  const views: LegacyFrequencyTargetView[] = [];
  for (const item of items) {
    views.push(toLegacyFrequencyTargetView(item));
  }
  return views;
}

export function sumLegacyFrequencyTargetView(view: LegacyFrequencyTargetView): number {
  const parsedDiscount = Number(view.discount);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discount} is not a number`);
  const parsedImpressions = Number(view.impressions);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressions} is not a number`);
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  return parsedDiscount + parsedImpressions + parsedOpenRate;
}
