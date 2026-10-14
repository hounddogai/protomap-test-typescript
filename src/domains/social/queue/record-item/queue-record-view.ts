import * as text from "../../../../kit/text.js";
import { QueueRecord } from "./queue-record.js";

/** How screens and exports show a queue record. */
export class QueueRecordView {
  codeText: string;
  label: string;
  currency: string;
  endsAt: string;
  limit: string;
  approved: string;
  active: string;
  sequence: string;
  utmSource: string;
  countryText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    currency: string,
    endsAt: string,
    limit: string,
    approved: string,
    active: string,
    sequence: string,
    utmSource: string,
    countryText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.currency = currency;
    this.endsAt = endsAt;
    this.limit = limit;
    this.approved = approved;
    this.active = active;
    this.sequence = sequence;
    this.utmSource = utmSource;
    this.countryText = countryText;
    this.statusLabel = statusLabel;
  }
}

export function toQueueRecordView(item: QueueRecord): QueueRecordView {
  return new QueueRecordView(
    text.truncate(item.code, 120),
    item.label,
    text.truncate(item.currency, 120),
    String(item.endsAt),
    String(item.limit),
    `${item.approved}`,
    `${item.active}`,
    String(item.sequence),
    text.truncate(item.utmSource, 64),
    item.country,
    `${item.status}`.toUpperCase(),
  );
}

export function toQueueRecordViews(items: QueueRecord[]): QueueRecordView[] {
  const views: QueueRecordView[] = [];
  for (const item of items) {
    views.push(toQueueRecordView(item));
  }
  return views;
}

export function sumQueueRecordView(view: QueueRecordView): number {
  const parsedEndsAt = Number(view.endsAt);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAt} is not a number`);
  const parsedLimit = Number(view.limit);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limit} is not a number`);
  const parsedSequence = Number(view.sequence);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequence} is not a number`);
  return parsedEndsAt + parsedLimit + parsedSequence;
}
