import * as text from "../../../../kit/text.js";
import { ManualDomainRecord } from "./manual-domain-record.js";

/** How screens and exports show a manual domain record. */
export class ManualDomainRecordView {
  code: string;
  name: string;
  graceDays: string;
  externalRefText: string;
  unitText: string;
  variant: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    graceDays: string,
    externalRefText: string,
    unitText: string,
    variant: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.graceDays = graceDays;
    this.externalRefText = externalRefText;
    this.unitText = unitText;
    this.variant = variant;
    this.statusLabel = statusLabel;
  }
}

export function toManualDomainRecordView(item: ManualDomainRecord): ManualDomainRecordView {
  return new ManualDomainRecordView(
    text.truncate(item.code, 80),
    item.name,
    String(item.graceDays),
    text.truncate(item.externalRef, 80),
    text.truncate(item.unit, 80),
    item.variant,
    `${item.status}`.toUpperCase(),
  );
}

export function toManualDomainRecordViews(items: ManualDomainRecord[]): ManualDomainRecordView[] {
  const views: ManualDomainRecordView[] = [];
  for (const item of items) {
    views.push(toManualDomainRecordView(item));
  }
  return views;
}

export function sumManualDomainRecordView(view: ManualDomainRecordView): number {
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  return parsedGraceDays;
}
