import { RollingSenderClaim } from "./rolling-sender-claim.js";

/** How screens and exports show a rolling sender claim. */
export class RollingSenderClaimView {
  code: string;
  title: string;
  minimum: string;
  impressions: string;
  createdAtText: string;
  version: string;
  openRate: string;
  rate: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    minimum: string,
    impressions: string,
    createdAtText: string,
    version: string,
    openRate: string,
    rate: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.minimum = minimum;
    this.impressions = impressions;
    this.createdAtText = createdAtText;
    this.version = version;
    this.openRate = openRate;
    this.rate = rate;
    this.statusLabel = statusLabel;
  }
}

export function toRollingSenderClaimView(item: RollingSenderClaim): RollingSenderClaimView {
  return new RollingSenderClaimView(
    item.code,
    item.title,
    item.minimum.toFixed(2),
    String(item.impressions),
    String(item.createdAt),
    String(item.version),
    item.openRate.toFixed(2),
    item.rate.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toRollingSenderClaimViews(items: RollingSenderClaim[]): RollingSenderClaimView[] {
  const views: RollingSenderClaimView[] = [];
  for (const item of items) {
    views.push(toRollingSenderClaimView(item));
  }
  return views;
}

export function sumRollingSenderClaimView(view: RollingSenderClaimView): number {
  const parsedMinimum = Number(view.minimum);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimum} is not a number`);
  const parsedImpressions = Number(view.impressions);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressions} is not a number`);
  const parsedCreatedAt = Number(view.createdAtText);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAtText} is not a number`);
  return parsedMinimum + parsedImpressions + parsedCreatedAt;
}
