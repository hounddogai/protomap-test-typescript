import { LegacyReputationTarget } from "./legacy-reputation-target.js";

/** How screens and exports show a legacy reputation target. */
export class LegacyReputationTargetView {
  codeText: string;
  title: string;
  campaignRef: string;
  conversionRate: string;
  sendAt: string;
  maximum: string;
  segment: string;
  floorValue: string;
  country: string;
  rate: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    campaignRef: string,
    conversionRate: string,
    sendAt: string,
    maximum: string,
    segment: string,
    floorValue: string,
    country: string,
    rate: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.campaignRef = campaignRef;
    this.conversionRate = conversionRate;
    this.sendAt = sendAt;
    this.maximum = maximum;
    this.segment = segment;
    this.floorValue = floorValue;
    this.country = country;
    this.rate = rate;
    this.statusLabel = statusLabel;
  }
}

export function toLegacyReputationTargetView(item: LegacyReputationTarget): LegacyReputationTargetView {
  return new LegacyReputationTargetView(
    item.code,
    item.title,
    item.campaignRef,
    item.conversionRate.toFixed(2),
    String(item.sendAt),
    item.maximum.toFixed(2),
    item.segment,
    item.floorValue.toFixed(2),
    item.country,
    item.rate.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toLegacyReputationTargetViews(items: LegacyReputationTarget[]): LegacyReputationTargetView[] {
  const views: LegacyReputationTargetView[] = [];
  for (const item of items) {
    views.push(toLegacyReputationTargetView(item));
  }
  return views;
}

export function sumLegacyReputationTargetView(view: LegacyReputationTargetView): number {
  const parsedConversionRate = Number(view.conversionRate);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRate} is not a number`);
  const parsedSendAt = Number(view.sendAt);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAt} is not a number`);
  const parsedMaximum = Number(view.maximum);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximum} is not a number`);
  return parsedConversionRate + parsedSendAt + parsedMaximum;
}
