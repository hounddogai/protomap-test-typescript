import * as text from "../../../../kit/text.js";
import { WeightedActivationAllocation } from "./weighted-activation-allocation.js";

/** How screens and exports show a weighted activation allocation. */
export class WeightedActivationAllocationView {
  code: string;
  nameText: string;
  pinned: string;
  campaignRef: string;
  minimum: string;
  impressions: string;
  capacity: string;
  conversionRate: string;
  endsAt: string;
  externalRef: string;
  score: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    pinned: string,
    campaignRef: string,
    minimum: string,
    impressions: string,
    capacity: string,
    conversionRate: string,
    endsAt: string,
    externalRef: string,
    score: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.pinned = pinned;
    this.campaignRef = campaignRef;
    this.minimum = minimum;
    this.impressions = impressions;
    this.capacity = capacity;
    this.conversionRate = conversionRate;
    this.endsAt = endsAt;
    this.externalRef = externalRef;
    this.score = score;
    this.statusLabel = statusLabel;
  }
}

export function toWeightedActivationAllocationView(item: WeightedActivationAllocation): WeightedActivationAllocationView {
  return new WeightedActivationAllocationView(
    item.code,
    text.truncate(item.name, 120),
    `${item.pinned}`,
    text.truncate(item.campaignRef, 120),
    item.minimum.toFixed(2),
    String(item.impressions),
    String(item.capacity),
    item.conversionRate.toFixed(2),
    String(item.endsAt),
    item.externalRef,
    item.score.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toWeightedActivationAllocationViews(items: WeightedActivationAllocation[]): WeightedActivationAllocationView[] {
  const views: WeightedActivationAllocationView[] = [];
  for (const item of items) {
    views.push(toWeightedActivationAllocationView(item));
  }
  return views;
}

export function sumWeightedActivationAllocationView(view: WeightedActivationAllocationView): number {
  const parsedMinimum = Number(view.minimum);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimum} is not a number`);
  const parsedImpressions = Number(view.impressions);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressions} is not a number`);
  const parsedCapacity = Number(view.capacity);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacity} is not a number`);
  return parsedMinimum + parsedImpressions + parsedCapacity;
}
