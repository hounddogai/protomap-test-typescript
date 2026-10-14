import * as text from "../../../../kit/text.js";
import { StrictDomainRecord } from "./strict-domain-record.js";

/** How screens and exports show a strict domain record. */
export class StrictDomainRecordView {
  code: string;
  titleText: string;
  graceDays: string;
  category: string;
  label: string;
  priority: string;
  currency: string;
  source: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    graceDays: string,
    category: string,
    label: string,
    priority: string,
    currency: string,
    source: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.graceDays = graceDays;
    this.category = category;
    this.label = label;
    this.priority = priority;
    this.currency = currency;
    this.source = source;
    this.statusLabel = statusLabel;
  }
}

export function toStrictDomainRecordView(item: StrictDomainRecord): StrictDomainRecordView {
  return new StrictDomainRecordView(
    text.truncate(item.code, 40),
    text.truncate(item.title, 80),
    String(item.graceDays),
    item.category,
    item.label,
    String(item.priority),
    item.currency,
    text.truncate(item.source, 64),
    `${item.status}`.toUpperCase(),
  );
}

export function toStrictDomainRecordViews(items: StrictDomainRecord[]): StrictDomainRecordView[] {
  const views: StrictDomainRecordView[] = [];
  for (const item of items) {
    views.push(toStrictDomainRecordView(item));
  }
  return views;
}

export function sumStrictDomainRecordView(view: StrictDomainRecordView): number {
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  return parsedGraceDays + parsedPriority;
}
