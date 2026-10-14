import * as text from "../../../../kit/text.js";
import { BidRuleCheckpoint } from "./bid-rule-checkpoint.js";

/** How screens and exports show a bid rule checkpoint. */
export class BidRuleCheckpointView {
  codeText: string;
  label: string;
  maximumText: string;
  rate: string;
  checksum: string;
  reviewer: string;
  currency: string;
  name: string;
  startsAt: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    maximumText: string,
    rate: string,
    checksum: string,
    reviewer: string,
    currency: string,
    name: string,
    startsAt: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.maximumText = maximumText;
    this.rate = rate;
    this.checksum = checksum;
    this.reviewer = reviewer;
    this.currency = currency;
    this.name = name;
    this.startsAt = startsAt;
    this.statusLabel = statusLabel;
  }
}

export function toBidRuleCheckpointView(item: BidRuleCheckpoint): BidRuleCheckpointView {
  return new BidRuleCheckpointView(
    text.truncate(item.code, 120),
    text.truncate(item.label, 120),
    item.maximum.toFixed(2),
    item.rate.toFixed(2),
    text.truncate(item.checksum, 64),
    item.reviewer,
    text.truncate(item.currency, 40),
    text.truncate(item.name, 40),
    String(item.startsAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toBidRuleCheckpointViews(items: BidRuleCheckpoint[]): BidRuleCheckpointView[] {
  const views: BidRuleCheckpointView[] = [];
  for (const item of items) {
    views.push(toBidRuleCheckpointView(item));
  }
  return views;
}

export function sumBidRuleCheckpointView(view: BidRuleCheckpointView): number {
  const parsedMaximum = Number(view.maximumText);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximumText} is not a number`);
  const parsedRate = Number(view.rate);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rate} is not a number`);
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  return parsedMaximum + parsedRate + parsedStartsAt;
}
