import * as text from "../../../../kit/text.js";
import { TieredBranchCycle } from "./tiered-branch-cycle.js";

/** How screens and exports show a tiered branch cycle. */
export class TieredBranchCycleView {
  code: string;
  name: string;
  ratioText: string;
  floorValue: string;
  label: string;
  maximum: string;
  source: string;
  timezone: string;
  windowDays: string;
  quantity: string;
  clicks: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    ratioText: string,
    floorValue: string,
    label: string,
    maximum: string,
    source: string,
    timezone: string,
    windowDays: string,
    quantity: string,
    clicks: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.ratioText = ratioText;
    this.floorValue = floorValue;
    this.label = label;
    this.maximum = maximum;
    this.source = source;
    this.timezone = timezone;
    this.windowDays = windowDays;
    this.quantity = quantity;
    this.clicks = clicks;
    this.statusLabel = statusLabel;
  }
}

export function toTieredBranchCycleView(item: TieredBranchCycle): TieredBranchCycleView {
  return new TieredBranchCycleView(
    item.code,
    item.name,
    item.ratio.toFixed(2),
    item.floorValue.toFixed(2),
    item.label,
    item.maximum.toFixed(2),
    text.truncate(item.source, 80),
    item.timezone,
    String(item.windowDays),
    String(item.quantity),
    String(item.clicks),
    `${item.status}`.toUpperCase(),
  );
}

export function toTieredBranchCycleViews(items: TieredBranchCycle[]): TieredBranchCycleView[] {
  const views: TieredBranchCycleView[] = [];
  for (const item of items) {
    views.push(toTieredBranchCycleView(item));
  }
  return views;
}

export function sumTieredBranchCycleView(view: TieredBranchCycleView): number {
  const parsedRatio = Number(view.ratioText);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratioText} is not a number`);
  const parsedFloorValue = Number(view.floorValue);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValue} is not a number`);
  const parsedMaximum = Number(view.maximum);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximum} is not a number`);
  return parsedRatio + parsedFloorValue + parsedMaximum;
}
