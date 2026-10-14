import * as text from "../../../../kit/text.js";
import { BounceGroup } from "./bounce-group.js";

/** How screens and exports show a bounce group. */
export class BounceGroupView {
  code: string;
  label: string;
  timezone: string;
  impressions: string;
  limit: string;
  country: string;
  conversionRate: string;
  weightText: string;
  campaignRef: string;
  channel: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    timezone: string,
    impressions: string,
    limit: string,
    country: string,
    conversionRate: string,
    weightText: string,
    campaignRef: string,
    channel: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.timezone = timezone;
    this.impressions = impressions;
    this.limit = limit;
    this.country = country;
    this.conversionRate = conversionRate;
    this.weightText = weightText;
    this.campaignRef = campaignRef;
    this.channel = channel;
    this.statusLabel = statusLabel;
  }
}

export function toBounceGroupView(item: BounceGroup): BounceGroupView {
  return new BounceGroupView(
    text.truncate(item.code, 80),
    item.label,
    item.timezone,
    String(item.impressions),
    String(item.limit),
    item.country,
    item.conversionRate.toFixed(2),
    item.weight.toFixed(2),
    text.truncate(item.campaignRef, 40),
    text.truncate(item.channel, 40),
    `${item.status}`.toUpperCase(),
  );
}

export function toBounceGroupViews(items: BounceGroup[]): BounceGroupView[] {
  const views: BounceGroupView[] = [];
  for (const item of items) {
    views.push(toBounceGroupView(item));
  }
  return views;
}

export function sumBounceGroupView(view: BounceGroupView): number {
  const parsedImpressions = Number(view.impressions);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressions} is not a number`);
  const parsedLimit = Number(view.limit);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limit} is not a number`);
  const parsedConversionRate = Number(view.conversionRate);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRate} is not a number`);
  return parsedImpressions + parsedLimit + parsedConversionRate;
}
