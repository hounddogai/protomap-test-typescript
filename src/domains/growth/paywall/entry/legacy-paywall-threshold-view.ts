import { LegacyPaywallThreshold } from "./legacy-paywall-threshold.js";

/** How screens and exports show a legacy paywall threshold. */
export class LegacyPaywallThresholdView {
  code: string;
  nameText: string;
  impressions: string;
  rateText: string;
  capacity: string;
  endsAt: string;
  source: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    impressions: string,
    rateText: string,
    capacity: string,
    endsAt: string,
    source: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.impressions = impressions;
    this.rateText = rateText;
    this.capacity = capacity;
    this.endsAt = endsAt;
    this.source = source;
    this.statusLabel = statusLabel;
  }
}

export function toLegacyPaywallThresholdView(item: LegacyPaywallThreshold): LegacyPaywallThresholdView {
  return new LegacyPaywallThresholdView(
    item.code,
    item.name,
    String(item.impressions),
    item.rate.toFixed(2),
    String(item.capacity),
    String(item.endsAt),
    item.source,
    `${item.status}`.toUpperCase(),
  );
}

export function toLegacyPaywallThresholdViews(items: LegacyPaywallThreshold[]): LegacyPaywallThresholdView[] {
  const views: LegacyPaywallThresholdView[] = [];
  for (const item of items) {
    views.push(toLegacyPaywallThresholdView(item));
  }
  return views;
}

export function sumLegacyPaywallThresholdView(view: LegacyPaywallThresholdView): number {
  const parsedImpressions = Number(view.impressions);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressions} is not a number`);
  const parsedRate = Number(view.rateText);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rateText} is not a number`);
  const parsedCapacity = Number(view.capacity);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacity} is not a number`);
  return parsedImpressions + parsedRate + parsedCapacity;
}
