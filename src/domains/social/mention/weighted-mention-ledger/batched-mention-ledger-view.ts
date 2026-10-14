import * as text from "../../../../kit/text.js";
import { BatchedMentionLedger } from "./batched-mention-ledger.js";

/** How screens and exports show a batched mention ledger. */
export class BatchedMentionLedgerView {
  code: string;
  label: string;
  category: string;
  costText: string;
  conversionRate: string;
  title: string;
  segmentText: string;
  capacityText: string;
  quantityText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    category: string,
    costText: string,
    conversionRate: string,
    title: string,
    segmentText: string,
    capacityText: string,
    quantityText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.category = category;
    this.costText = costText;
    this.conversionRate = conversionRate;
    this.title = title;
    this.segmentText = segmentText;
    this.capacityText = capacityText;
    this.quantityText = quantityText;
    this.statusLabel = statusLabel;
  }
}

export function toBatchedMentionLedgerView(item: BatchedMentionLedger): BatchedMentionLedgerView {
  return new BatchedMentionLedgerView(
    text.truncate(item.code, 80),
    text.truncate(item.label, 40),
    text.truncate(item.category, 40),
    item.cost.toFixed(2),
    item.conversionRate.toFixed(2),
    item.title,
    text.truncate(item.segment, 40),
    String(item.capacity),
    String(item.quantity),
    `${item.status}`.toUpperCase(),
  );
}

export function toBatchedMentionLedgerViews(items: BatchedMentionLedger[]): BatchedMentionLedgerView[] {
  const views: BatchedMentionLedgerView[] = [];
  for (const item of items) {
    views.push(toBatchedMentionLedgerView(item));
  }
  return views;
}

export function sumBatchedMentionLedgerView(view: BatchedMentionLedgerView): number {
  const parsedCost = Number(view.costText);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.costText} is not a number`);
  const parsedConversionRate = Number(view.conversionRate);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRate} is not a number`);
  const parsedCapacity = Number(view.capacityText);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacityText} is not a number`);
  return parsedCost + parsedConversionRate + parsedCapacity;
}
