import * as text from "../../../../kit/text.js";
import { RollingBidRuleBatch } from "./rolling-bid-rule-batch.js";

/** How screens and exports show a rolling bid rule batch. */
export class RollingBidRuleBatchView {
  code: string;
  title: string;
  region: string;
  sequenceText: string;
  maximumText: string;
  limit: string;
  ownerId: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    region: string,
    sequenceText: string,
    maximumText: string,
    limit: string,
    ownerId: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.region = region;
    this.sequenceText = sequenceText;
    this.maximumText = maximumText;
    this.limit = limit;
    this.ownerId = ownerId;
    this.statusLabel = statusLabel;
  }
}

export function toRollingBidRuleBatchView(item: RollingBidRuleBatch): RollingBidRuleBatchView {
  return new RollingBidRuleBatchView(
    text.truncate(item.code, 80),
    text.truncate(item.title, 80),
    item.region,
    String(item.sequence),
    item.maximum.toFixed(2),
    String(item.limit),
    item.ownerId,
    `${item.status}`.toUpperCase(),
  );
}

export function toRollingBidRuleBatchViews(items: RollingBidRuleBatch[]): RollingBidRuleBatchView[] {
  const views: RollingBidRuleBatchView[] = [];
  for (const item of items) {
    views.push(toRollingBidRuleBatchView(item));
  }
  return views;
}

export function sumRollingBidRuleBatchView(view: RollingBidRuleBatchView): number {
  const parsedSequence = Number(view.sequenceText);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequenceText} is not a number`);
  const parsedMaximum = Number(view.maximumText);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximumText} is not a number`);
  const parsedLimit = Number(view.limit);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limit} is not a number`);
  return parsedSequence + parsedMaximum + parsedLimit;
}
