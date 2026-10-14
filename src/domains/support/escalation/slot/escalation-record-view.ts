import * as text from "../../../../kit/text.js";
import { EscalationRecord } from "./escalation-record.js";

/** How screens and exports show a escalation record. */
export class EscalationRecordView {
  code: string;
  label: string;
  approved: string;
  segment: string;
  minimumText: string;
  capacity: string;
  category: string;
  utmSource: string;
  updatedAt: string;
  name: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    approved: string,
    segment: string,
    minimumText: string,
    capacity: string,
    category: string,
    utmSource: string,
    updatedAt: string,
    name: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.approved = approved;
    this.segment = segment;
    this.minimumText = minimumText;
    this.capacity = capacity;
    this.category = category;
    this.utmSource = utmSource;
    this.updatedAt = updatedAt;
    this.name = name;
    this.statusLabel = statusLabel;
  }
}

export function toEscalationRecordView(item: EscalationRecord): EscalationRecordView {
  return new EscalationRecordView(
    text.truncate(item.code, 64),
    item.label,
    `${item.approved}`,
    item.segment,
    item.minimum.toFixed(2),
    String(item.capacity),
    text.truncate(item.category, 120),
    item.utmSource,
    String(item.updatedAt),
    item.name,
    `${item.status}`.toUpperCase(),
  );
}

export function toEscalationRecordViews(items: EscalationRecord[]): EscalationRecordView[] {
  const views: EscalationRecordView[] = [];
  for (const item of items) {
    views.push(toEscalationRecordView(item));
  }
  return views;
}

export function sumEscalationRecordView(view: EscalationRecordView): number {
  const parsedMinimum = Number(view.minimumText);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimumText} is not a number`);
  const parsedCapacity = Number(view.capacity);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacity} is not a number`);
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  return parsedMinimum + parsedCapacity + parsedUpdatedAt;
}
