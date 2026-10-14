import * as text from "../../../../kit/text.js";
import { CappedActivationLedger } from "./capped-activation-ledger.js";

/** How screens and exports show a capped activation ledger. */
export class CappedActivationLedgerView {
  code: string;
  title: string;
  cohortText: string;
  category: string;
  capacity: string;
  batchSize: string;
  sendAtText: string;
  ownerId: string;
  minimum: string;
  margin: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    cohortText: string,
    category: string,
    capacity: string,
    batchSize: string,
    sendAtText: string,
    ownerId: string,
    minimum: string,
    margin: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.cohortText = cohortText;
    this.category = category;
    this.capacity = capacity;
    this.batchSize = batchSize;
    this.sendAtText = sendAtText;
    this.ownerId = ownerId;
    this.minimum = minimum;
    this.margin = margin;
    this.statusLabel = statusLabel;
  }
}

export function toCappedActivationLedgerView(item: CappedActivationLedger): CappedActivationLedgerView {
  return new CappedActivationLedgerView(
    item.code,
    item.title,
    text.truncate(item.cohort, 120),
    item.category,
    String(item.capacity),
    String(item.batchSize),
    String(item.sendAt),
    item.ownerId,
    item.minimum.toFixed(2),
    item.margin.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toCappedActivationLedgerViews(items: CappedActivationLedger[]): CappedActivationLedgerView[] {
  const views: CappedActivationLedgerView[] = [];
  for (const item of items) {
    views.push(toCappedActivationLedgerView(item));
  }
  return views;
}

export function sumCappedActivationLedgerView(view: CappedActivationLedgerView): number {
  const parsedCapacity = Number(view.capacity);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacity} is not a number`);
  const parsedBatchSize = Number(view.batchSize);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSize} is not a number`);
  const parsedSendAt = Number(view.sendAtText);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAtText} is not a number`);
  return parsedCapacity + parsedBatchSize + parsedSendAt;
}
