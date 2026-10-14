import * as text from "../../../../kit/text.js";
import { PrimaryRewardVariance } from "./primary-reward-variance.js";

/** How screens and exports show a primary reward variance. */
export class PrimaryRewardVarianceView {
  code: string;
  label: string;
  clicks: string;
  floorValue: string;
  pinned: string;
  threshold: string;
  retries: string;
  name: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    clicks: string,
    floorValue: string,
    pinned: string,
    threshold: string,
    retries: string,
    name: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.clicks = clicks;
    this.floorValue = floorValue;
    this.pinned = pinned;
    this.threshold = threshold;
    this.retries = retries;
    this.name = name;
    this.statusLabel = statusLabel;
  }
}

export function toPrimaryRewardVarianceView(item: PrimaryRewardVariance): PrimaryRewardVarianceView {
  return new PrimaryRewardVarianceView(
    text.truncate(item.code, 40),
    item.label,
    String(item.clicks),
    item.floorValue.toFixed(2),
    `${item.pinned}`,
    item.threshold.toFixed(2),
    String(item.retries),
    item.name,
    `${item.status}`.toUpperCase(),
  );
}

export function toPrimaryRewardVarianceViews(items: PrimaryRewardVariance[]): PrimaryRewardVarianceView[] {
  const views: PrimaryRewardVarianceView[] = [];
  for (const item of items) {
    views.push(toPrimaryRewardVarianceView(item));
  }
  return views;
}

export function sumPrimaryRewardVarianceView(view: PrimaryRewardVarianceView): number {
  const parsedClicks = Number(view.clicks);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicks} is not a number`);
  const parsedFloorValue = Number(view.floorValue);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValue} is not a number`);
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  return parsedClicks + parsedFloorValue + parsedThreshold;
}
