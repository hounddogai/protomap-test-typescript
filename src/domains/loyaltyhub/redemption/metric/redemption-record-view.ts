import * as text from "../../../../kit/text.js";
import { RedemptionRecord } from "./redemption-record.js";

/** How screens and exports show a redemption record. */
export class RedemptionRecordView {
  code: string;
  labelText: string;
  externalRefText: string;
  marginText: string;
  budget: string;
  ownerId: string;
  sequence: string;
  name: string;
  reviewerText: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    externalRefText: string,
    marginText: string,
    budget: string,
    ownerId: string,
    sequence: string,
    name: string,
    reviewerText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.externalRefText = externalRefText;
    this.marginText = marginText;
    this.budget = budget;
    this.ownerId = ownerId;
    this.sequence = sequence;
    this.name = name;
    this.reviewerText = reviewerText;
    this.statusLabel = statusLabel;
  }
}

export function toRedemptionRecordView(item: RedemptionRecord): RedemptionRecordView {
  return new RedemptionRecordView(
    text.truncate(item.code, 80),
    text.truncate(item.label, 120),
    item.externalRef,
    item.margin.toFixed(2),
    item.budget.toFixed(2),
    item.ownerId,
    String(item.sequence),
    item.name,
    text.truncate(item.reviewer, 80),
    `${item.status}`.toUpperCase(),
  );
}

export function toRedemptionRecordViews(items: RedemptionRecord[]): RedemptionRecordView[] {
  const views: RedemptionRecordView[] = [];
  for (const item of items) {
    views.push(toRedemptionRecordView(item));
  }
  return views;
}

export function sumRedemptionRecordView(view: RedemptionRecordView): number {
  const parsedMargin = Number(view.marginText);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.marginText} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedSequence = Number(view.sequence);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequence} is not a number`);
  return parsedMargin + parsedBudget + parsedSequence;
}
