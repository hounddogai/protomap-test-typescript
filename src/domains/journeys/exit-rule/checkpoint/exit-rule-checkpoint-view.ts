import * as text from "../../../../kit/text.js";
import { ExitRuleCheckpoint } from "./exit-rule-checkpoint.js";

/** How screens and exports show a exit rule checkpoint. */
export class ExitRuleCheckpointView {
  code: string;
  title: string;
  versionText: string;
  reviewerText: string;
  capacityText: string;
  floorValue: string;
  bid: string;
  currency: string;
  amount: string;
  rate: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    versionText: string,
    reviewerText: string,
    capacityText: string,
    floorValue: string,
    bid: string,
    currency: string,
    amount: string,
    rate: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.versionText = versionText;
    this.reviewerText = reviewerText;
    this.capacityText = capacityText;
    this.floorValue = floorValue;
    this.bid = bid;
    this.currency = currency;
    this.amount = amount;
    this.rate = rate;
    this.statusLabel = statusLabel;
  }
}

export function toExitRuleCheckpointView(item: ExitRuleCheckpoint): ExitRuleCheckpointView {
  return new ExitRuleCheckpointView(
    item.code,
    item.title,
    String(item.version),
    item.reviewer,
    String(item.capacity),
    item.floorValue.toFixed(2),
    item.bid.toFixed(2),
    text.truncate(item.currency, 120),
    item.amount.toFixed(2),
    item.rate.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toExitRuleCheckpointViews(items: ExitRuleCheckpoint[]): ExitRuleCheckpointView[] {
  const views: ExitRuleCheckpointView[] = [];
  for (const item of items) {
    views.push(toExitRuleCheckpointView(item));
  }
  return views;
}

export function sumExitRuleCheckpointView(view: ExitRuleCheckpointView): number {
  const parsedVersion = Number(view.versionText);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.versionText} is not a number`);
  const parsedCapacity = Number(view.capacityText);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacityText} is not a number`);
  const parsedFloorValue = Number(view.floorValue);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValue} is not a number`);
  return parsedVersion + parsedCapacity + parsedFloorValue;
}
