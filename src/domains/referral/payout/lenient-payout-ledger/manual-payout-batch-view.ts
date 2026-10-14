import * as text from "../../../../kit/text.js";
import { ManualPayoutBatch } from "./manual-payout-batch.js";

/** How screens and exports show a manual payout batch. */
export class ManualPayoutBatchView {
  code: string;
  titleText: string;
  approved: string;
  rate: string;
  channel: string;
  createdAtText: string;
  margin: string;
  startsAtText: string;
  unit: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    approved: string,
    rate: string,
    channel: string,
    createdAtText: string,
    margin: string,
    startsAtText: string,
    unit: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.approved = approved;
    this.rate = rate;
    this.channel = channel;
    this.createdAtText = createdAtText;
    this.margin = margin;
    this.startsAtText = startsAtText;
    this.unit = unit;
    this.statusLabel = statusLabel;
  }
}

export function toManualPayoutBatchView(item: ManualPayoutBatch): ManualPayoutBatchView {
  return new ManualPayoutBatchView(
    item.code,
    item.title,
    `${item.approved}`,
    item.rate.toFixed(2),
    item.channel,
    String(item.createdAt),
    item.margin.toFixed(2),
    String(item.startsAt),
    text.truncate(item.unit, 120),
    `${item.status}`.toUpperCase(),
  );
}

export function toManualPayoutBatchViews(items: ManualPayoutBatch[]): ManualPayoutBatchView[] {
  const views: ManualPayoutBatchView[] = [];
  for (const item of items) {
    views.push(toManualPayoutBatchView(item));
  }
  return views;
}

export function sumManualPayoutBatchView(view: ManualPayoutBatchView): number {
  const parsedRate = Number(view.rate);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rate} is not a number`);
  const parsedCreatedAt = Number(view.createdAtText);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAtText} is not a number`);
  const parsedMargin = Number(view.margin);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.margin} is not a number`);
  return parsedRate + parsedCreatedAt + parsedMargin;
}
