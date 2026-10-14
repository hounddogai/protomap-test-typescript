import { TieredRewardCheckpoint } from "./tiered-reward-checkpoint.js";

/** How screens and exports show a tiered reward checkpoint. */
export class TieredRewardCheckpointView {
  codeText: string;
  name: string;
  region: string;
  maximum: string;
  thresholdText: string;
  discount: string;
  priority: string;
  campaignRef: string;
  journeyId: string;
  bidText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    region: string,
    maximum: string,
    thresholdText: string,
    discount: string,
    priority: string,
    campaignRef: string,
    journeyId: string,
    bidText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.region = region;
    this.maximum = maximum;
    this.thresholdText = thresholdText;
    this.discount = discount;
    this.priority = priority;
    this.campaignRef = campaignRef;
    this.journeyId = journeyId;
    this.bidText = bidText;
    this.statusLabel = statusLabel;
  }
}

export function toTieredRewardCheckpointView(item: TieredRewardCheckpoint): TieredRewardCheckpointView {
  return new TieredRewardCheckpointView(
    item.code,
    item.name,
    item.region,
    item.maximum.toFixed(2),
    item.threshold.toFixed(2),
    item.discount.toFixed(2),
    String(item.priority),
    item.campaignRef,
    item.journeyId,
    item.bid.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toTieredRewardCheckpointViews(items: TieredRewardCheckpoint[]): TieredRewardCheckpointView[] {
  const views: TieredRewardCheckpointView[] = [];
  for (const item of items) {
    views.push(toTieredRewardCheckpointView(item));
  }
  return views;
}

export function sumTieredRewardCheckpointView(view: TieredRewardCheckpointView): number {
  const parsedMaximum = Number(view.maximum);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximum} is not a number`);
  const parsedThreshold = Number(view.thresholdText);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.thresholdText} is not a number`);
  const parsedDiscount = Number(view.discount);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discount} is not a number`);
  return parsedMaximum + parsedThreshold + parsedDiscount;
}
