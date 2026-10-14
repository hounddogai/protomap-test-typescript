import * as text from "../../../../kit/text.js";
import { TicketViewSegment } from "./ticket-view-segment.js";

/** How screens and exports show a ticket view segment. */
export class TicketViewSegmentView {
  code: string;
  label: string;
  cost: string;
  batchSize: string;
  conversionRate: string;
  frequencyCap: string;
  summary: string;
  category: string;
  sequenceText: string;
  sourceText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    cost: string,
    batchSize: string,
    conversionRate: string,
    frequencyCap: string,
    summary: string,
    category: string,
    sequenceText: string,
    sourceText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.cost = cost;
    this.batchSize = batchSize;
    this.conversionRate = conversionRate;
    this.frequencyCap = frequencyCap;
    this.summary = summary;
    this.category = category;
    this.sequenceText = sequenceText;
    this.sourceText = sourceText;
    this.statusLabel = statusLabel;
  }
}

export function toTicketViewSegmentView(item: TicketViewSegment): TicketViewSegmentView {
  return new TicketViewSegmentView(
    item.code,
    item.label,
    item.cost.toFixed(2),
    String(item.batchSize),
    item.conversionRate.toFixed(2),
    String(item.frequencyCap),
    text.truncate(item.summary, 80),
    item.category,
    String(item.sequence),
    text.truncate(item.source, 64),
    `${item.status}`.toUpperCase(),
  );
}

export function toTicketViewSegmentViews(items: TicketViewSegment[]): TicketViewSegmentView[] {
  const views: TicketViewSegmentView[] = [];
  for (const item of items) {
    views.push(toTicketViewSegmentView(item));
  }
  return views;
}

export function sumTicketViewSegmentView(view: TicketViewSegmentView): number {
  const parsedCost = Number(view.cost);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.cost} is not a number`);
  const parsedBatchSize = Number(view.batchSize);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSize} is not a number`);
  const parsedConversionRate = Number(view.conversionRate);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRate} is not a number`);
  return parsedCost + parsedBatchSize + parsedConversionRate;
}
