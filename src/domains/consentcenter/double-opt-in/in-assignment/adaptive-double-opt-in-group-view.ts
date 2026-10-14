import * as text from "../../../../kit/text.js";
import { AdaptiveDoubleOptInGroup } from "./adaptive-double-opt-in-group.js";

/** How screens and exports show a adaptive double opt in group. */
export class AdaptiveDoubleOptInGroupView {
  code: string;
  titleText: string;
  weight: string;
  floorValue: string;
  description: string;
  updatedAt: string;
  campaignRef: string;
  threshold: string;
  scoreText: string;
  country: string;
  ceilingText: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    weight: string,
    floorValue: string,
    description: string,
    updatedAt: string,
    campaignRef: string,
    threshold: string,
    scoreText: string,
    country: string,
    ceilingText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.weight = weight;
    this.floorValue = floorValue;
    this.description = description;
    this.updatedAt = updatedAt;
    this.campaignRef = campaignRef;
    this.threshold = threshold;
    this.scoreText = scoreText;
    this.country = country;
    this.ceilingText = ceilingText;
    this.statusLabel = statusLabel;
  }
}

export function toAdaptiveDoubleOptInGroupView(item: AdaptiveDoubleOptInGroup): AdaptiveDoubleOptInGroupView {
  return new AdaptiveDoubleOptInGroupView(
    item.code,
    item.title,
    item.weight.toFixed(2),
    item.floorValue.toFixed(2),
    item.description,
    String(item.updatedAt),
    text.truncate(item.campaignRef, 64),
    item.threshold.toFixed(2),
    item.score.toFixed(2),
    item.country,
    item.ceiling.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toAdaptiveDoubleOptInGroupViews(items: AdaptiveDoubleOptInGroup[]): AdaptiveDoubleOptInGroupView[] {
  const views: AdaptiveDoubleOptInGroupView[] = [];
  for (const item of items) {
    views.push(toAdaptiveDoubleOptInGroupView(item));
  }
  return views;
}

export function sumAdaptiveDoubleOptInGroupView(view: AdaptiveDoubleOptInGroupView): number {
  const parsedWeight = Number(view.weight);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weight} is not a number`);
  const parsedFloorValue = Number(view.floorValue);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValue} is not a number`);
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  return parsedWeight + parsedFloorValue + parsedUpdatedAt;
}
