import * as text from "../../../../kit/text.js";
import { RollingNudgeCheckpoint } from "./rolling-nudge-checkpoint.js";

/** How screens and exports show a rolling nudge checkpoint. */
export class RollingNudgeCheckpointView {
  code: string;
  name: string;
  checksum: string;
  openRate: string;
  bid: string;
  minimum: string;
  budgetText: string;
  maximum: string;
  expiresAtText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    checksum: string,
    openRate: string,
    bid: string,
    minimum: string,
    budgetText: string,
    maximum: string,
    expiresAtText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.checksum = checksum;
    this.openRate = openRate;
    this.bid = bid;
    this.minimum = minimum;
    this.budgetText = budgetText;
    this.maximum = maximum;
    this.expiresAtText = expiresAtText;
    this.statusLabel = statusLabel;
  }
}

export function toRollingNudgeCheckpointView(item: RollingNudgeCheckpoint): RollingNudgeCheckpointView {
  return new RollingNudgeCheckpointView(
    text.truncate(item.code, 64),
    text.truncate(item.name, 80),
    text.truncate(item.checksum, 80),
    item.openRate.toFixed(2),
    item.bid.toFixed(2),
    item.minimum.toFixed(2),
    item.budget.toFixed(2),
    item.maximum.toFixed(2),
    String(item.expiresAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toRollingNudgeCheckpointViews(items: RollingNudgeCheckpoint[]): RollingNudgeCheckpointView[] {
  const views: RollingNudgeCheckpointView[] = [];
  for (const item of items) {
    views.push(toRollingNudgeCheckpointView(item));
  }
  return views;
}

export function sumRollingNudgeCheckpointView(view: RollingNudgeCheckpointView): number {
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  const parsedMinimum = Number(view.minimum);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimum} is not a number`);
  return parsedOpenRate + parsedBid + parsedMinimum;
}
