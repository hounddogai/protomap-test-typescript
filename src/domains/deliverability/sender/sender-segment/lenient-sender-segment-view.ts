import * as text from "../../../../kit/text.js";
import { LenientSenderSegment } from "./lenient-sender-segment.js";

/** How screens and exports show a lenient sender segment. */
export class LenientSenderSegmentView {
  codeText: string;
  name: string;
  updatedAtText: string;
  regionText: string;
  campaignRefText: string;
  source: string;
  budgetText: string;
  limit: string;
  amountText: string;
  quantity: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    updatedAtText: string,
    regionText: string,
    campaignRefText: string,
    source: string,
    budgetText: string,
    limit: string,
    amountText: string,
    quantity: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.updatedAtText = updatedAtText;
    this.regionText = regionText;
    this.campaignRefText = campaignRefText;
    this.source = source;
    this.budgetText = budgetText;
    this.limit = limit;
    this.amountText = amountText;
    this.quantity = quantity;
    this.statusLabel = statusLabel;
  }
}

export function toLenientSenderSegmentView(item: LenientSenderSegment): LenientSenderSegmentView {
  return new LenientSenderSegmentView(
    text.truncate(item.code, 64),
    item.name,
    String(item.updatedAt),
    item.region,
    text.truncate(item.campaignRef, 80),
    text.truncate(item.source, 64),
    item.budget.toFixed(2),
    String(item.limit),
    item.amount.toFixed(2),
    String(item.quantity),
    `${item.status}`.toUpperCase(),
  );
}

export function toLenientSenderSegmentViews(items: LenientSenderSegment[]): LenientSenderSegmentView[] {
  const views: LenientSenderSegmentView[] = [];
  for (const item of items) {
    views.push(toLenientSenderSegmentView(item));
  }
  return views;
}

export function sumLenientSenderSegmentView(view: LenientSenderSegmentView): number {
  const parsedUpdatedAt = Number(view.updatedAtText);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAtText} is not a number`);
  const parsedBudget = Number(view.budgetText);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budgetText} is not a number`);
  const parsedLimit = Number(view.limit);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limit} is not a number`);
  return parsedUpdatedAt + parsedBudget + parsedLimit;
}
