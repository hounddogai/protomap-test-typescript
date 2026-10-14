import * as text from "../../../../kit/text.js";
import { TieredSubscriptionAllocation } from "./tiered-subscription-allocation.js";

/** How screens and exports show a tiered subscription allocation. */
export class TieredSubscriptionAllocationView {
  codeText: string;
  title: string;
  scoreText: string;
  channel: string;
  floorValue: string;
  unit: string;
  reviewer: string;
  windowDays: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    scoreText: string,
    channel: string,
    floorValue: string,
    unit: string,
    reviewer: string,
    windowDays: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.scoreText = scoreText;
    this.channel = channel;
    this.floorValue = floorValue;
    this.unit = unit;
    this.reviewer = reviewer;
    this.windowDays = windowDays;
    this.statusLabel = statusLabel;
  }
}

export function toTieredSubscriptionAllocationView(item: TieredSubscriptionAllocation): TieredSubscriptionAllocationView {
  return new TieredSubscriptionAllocationView(
    item.code,
    item.title,
    item.score.toFixed(2),
    item.channel,
    item.floorValue.toFixed(2),
    text.truncate(item.unit, 120),
    item.reviewer,
    String(item.windowDays),
    `${item.status}`.toUpperCase(),
  );
}

export function toTieredSubscriptionAllocationViews(items: TieredSubscriptionAllocation[]): TieredSubscriptionAllocationView[] {
  const views: TieredSubscriptionAllocationView[] = [];
  for (const item of items) {
    views.push(toTieredSubscriptionAllocationView(item));
  }
  return views;
}

export function sumTieredSubscriptionAllocationView(view: TieredSubscriptionAllocationView): number {
  const parsedScore = Number(view.scoreText);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.scoreText} is not a number`);
  const parsedFloorValue = Number(view.floorValue);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValue} is not a number`);
  const parsedWindowDays = Number(view.windowDays);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDays} is not a number`);
  return parsedScore + parsedFloorValue + parsedWindowDays;
}
