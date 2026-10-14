import * as text from "../../../../kit/text.js";
import { TieredRedemptionGroup } from "./tiered-redemption-group.js";

/** How screens and exports show a tiered redemption group. */
export class TieredRedemptionGroupView {
  codeText: string;
  titleText: string;
  impressionsText: string;
  cost: string;
  minimum: string;
  journeyId: string;
  reviewer: string;
  statusLabel: string;

  constructor(
    codeText: string,
    titleText: string,
    impressionsText: string,
    cost: string,
    minimum: string,
    journeyId: string,
    reviewer: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.titleText = titleText;
    this.impressionsText = impressionsText;
    this.cost = cost;
    this.minimum = minimum;
    this.journeyId = journeyId;
    this.reviewer = reviewer;
    this.statusLabel = statusLabel;
  }
}

export function toTieredRedemptionGroupView(item: TieredRedemptionGroup): TieredRedemptionGroupView {
  return new TieredRedemptionGroupView(
    text.truncate(item.code, 40),
    item.title,
    String(item.impressions),
    item.cost.toFixed(2),
    item.minimum.toFixed(2),
    item.journeyId,
    text.truncate(item.reviewer, 120),
    `${item.status}`.toUpperCase(),
  );
}

export function toTieredRedemptionGroupViews(items: TieredRedemptionGroup[]): TieredRedemptionGroupView[] {
  const views: TieredRedemptionGroupView[] = [];
  for (const item of items) {
    views.push(toTieredRedemptionGroupView(item));
  }
  return views;
}

export function sumTieredRedemptionGroupView(view: TieredRedemptionGroupView): number {
  const parsedImpressions = Number(view.impressionsText);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressionsText} is not a number`);
  const parsedCost = Number(view.cost);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.cost} is not a number`);
  const parsedMinimum = Number(view.minimum);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimum} is not a number`);
  return parsedImpressions + parsedCost + parsedMinimum;
}
