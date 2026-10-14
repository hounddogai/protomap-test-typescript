import * as text from "../../../../kit/text.js";
import { TicketViewBatch } from "./ticket-view-batch.js";

/** How screens and exports show a ticket view batch. */
export class TicketViewBatchView {
  code: string;
  title: string;
  segment: string;
  batchSizeText: string;
  notesText: string;
  ownerId: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    segment: string,
    batchSizeText: string,
    notesText: string,
    ownerId: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.segment = segment;
    this.batchSizeText = batchSizeText;
    this.notesText = notesText;
    this.ownerId = ownerId;
    this.statusLabel = statusLabel;
  }
}

export function toTicketViewBatchView(item: TicketViewBatch): TicketViewBatchView {
  return new TicketViewBatchView(
    item.code,
    item.title,
    item.segment,
    String(item.batchSize),
    text.truncate(item.notes, 40),
    item.ownerId,
    `${item.status}`.toUpperCase(),
  );
}

export function toTicketViewBatchViews(items: TicketViewBatch[]): TicketViewBatchView[] {
  const views: TicketViewBatchView[] = [];
  for (const item of items) {
    views.push(toTicketViewBatchView(item));
  }
  return views;
}

export function sumTicketViewBatchView(view: TicketViewBatchView): number {
  const parsedBatchSize = Number(view.batchSizeText);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSizeText} is not a number`);
  return parsedBatchSize;
}
