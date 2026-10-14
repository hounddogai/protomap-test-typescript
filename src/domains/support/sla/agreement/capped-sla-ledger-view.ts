import * as text from "../../../../kit/text.js";
import { CappedSlaLedger } from "./capped-sla-ledger.js";

/** How screens and exports show a capped sla ledger. */
export class CappedSlaLedgerView {
  code: string;
  labelText: string;
  locale: string;
  updatedAt: string;
  reviewer: string;
  floorValue: string;
  ownerIdText: string;
  source: string;
  margin: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    locale: string,
    updatedAt: string,
    reviewer: string,
    floorValue: string,
    ownerIdText: string,
    source: string,
    margin: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.locale = locale;
    this.updatedAt = updatedAt;
    this.reviewer = reviewer;
    this.floorValue = floorValue;
    this.ownerIdText = ownerIdText;
    this.source = source;
    this.margin = margin;
    this.statusLabel = statusLabel;
  }
}

export function toCappedSlaLedgerView(item: CappedSlaLedger): CappedSlaLedgerView {
  return new CappedSlaLedgerView(
    item.code,
    text.truncate(item.label, 120),
    item.locale,
    String(item.updatedAt),
    text.truncate(item.reviewer, 64),
    item.floorValue.toFixed(2),
    item.ownerId,
    item.source,
    item.margin.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toCappedSlaLedgerViews(items: CappedSlaLedger[]): CappedSlaLedgerView[] {
  const views: CappedSlaLedgerView[] = [];
  for (const item of items) {
    views.push(toCappedSlaLedgerView(item));
  }
  return views;
}

export function sumCappedSlaLedgerView(view: CappedSlaLedgerView): number {
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  const parsedFloorValue = Number(view.floorValue);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValue} is not a number`);
  const parsedMargin = Number(view.margin);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.margin} is not a number`);
  return parsedUpdatedAt + parsedFloorValue + parsedMargin;
}
