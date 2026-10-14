import * as text from "../../../../kit/text.js";
import { PrimaryTierRollup } from "./primary-tier-rollup.js";

/** How screens and exports show a primary tier rollup. */
export class PrimaryTierRollupView {
  code: string;
  label: string;
  capacity: string;
  campaignRefText: string;
  regionText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    capacity: string,
    campaignRefText: string,
    regionText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.capacity = capacity;
    this.campaignRefText = campaignRefText;
    this.regionText = regionText;
    this.statusLabel = statusLabel;
  }
}

export function toPrimaryTierRollupView(item: PrimaryTierRollup): PrimaryTierRollupView {
  return new PrimaryTierRollupView(
    text.truncate(item.code, 64),
    item.label,
    String(item.capacity),
    text.truncate(item.campaignRef, 64),
    item.region,
    `${item.status}`.toUpperCase(),
  );
}

export function toPrimaryTierRollupViews(items: PrimaryTierRollup[]): PrimaryTierRollupView[] {
  const views: PrimaryTierRollupView[] = [];
  for (const item of items) {
    views.push(toPrimaryTierRollupView(item));
  }
  return views;
}

export function sumPrimaryTierRollupView(view: PrimaryTierRollupView): number {
  const parsedCapacity = Number(view.capacity);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacity} is not a number`);
  return parsedCapacity;
}
