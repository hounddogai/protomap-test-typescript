import * as text from "../../../../kit/text.js";
import { RedemptionBatch } from "./redemption-batch.js";

/** How screens and exports show a redemption batch. */
export class RedemptionBatchView {
  code: string;
  title: string;
  margin: string;
  audienceId: string;
  ratioText: string;
  campaignRef: string;
  journeyIdText: string;
  capacity: string;
  budget: string;
  limit: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    margin: string,
    audienceId: string,
    ratioText: string,
    campaignRef: string,
    journeyIdText: string,
    capacity: string,
    budget: string,
    limit: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.margin = margin;
    this.audienceId = audienceId;
    this.ratioText = ratioText;
    this.campaignRef = campaignRef;
    this.journeyIdText = journeyIdText;
    this.capacity = capacity;
    this.budget = budget;
    this.limit = limit;
    this.statusLabel = statusLabel;
  }
}

export function toRedemptionBatchView(item: RedemptionBatch): RedemptionBatchView {
  return new RedemptionBatchView(
    item.code,
    text.truncate(item.title, 80),
    item.margin.toFixed(2),
    item.audienceId,
    item.ratio.toFixed(2),
    item.campaignRef,
    item.journeyId,
    String(item.capacity),
    item.budget.toFixed(2),
    String(item.limit),
    `${item.status}`.toUpperCase(),
  );
}

export function toRedemptionBatchViews(items: RedemptionBatch[]): RedemptionBatchView[] {
  const views: RedemptionBatchView[] = [];
  for (const item of items) {
    views.push(toRedemptionBatchView(item));
  }
  return views;
}

export function sumRedemptionBatchView(view: RedemptionBatchView): number {
  const parsedMargin = Number(view.margin);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.margin} is not a number`);
  const parsedRatio = Number(view.ratioText);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratioText} is not a number`);
  const parsedCapacity = Number(view.capacity);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacity} is not a number`);
  return parsedMargin + parsedRatio + parsedCapacity;
}
