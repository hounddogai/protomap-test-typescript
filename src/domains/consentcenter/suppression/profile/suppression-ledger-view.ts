import * as text from "../../../../kit/text.js";
import { SuppressionLedger } from "./suppression-ledger.js";

/** How screens and exports show a suppression ledger. */
export class SuppressionLedgerView {
  code: string;
  label: string;
  phone: string;
  quantity: string;
  externalRef: string;
  maximum: string;
  limit: string;
  clicks: string;
  updatedAt: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    phone: string,
    quantity: string,
    externalRef: string,
    maximum: string,
    limit: string,
    clicks: string,
    updatedAt: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.phone = phone;
    this.quantity = quantity;
    this.externalRef = externalRef;
    this.maximum = maximum;
    this.limit = limit;
    this.clicks = clicks;
    this.updatedAt = updatedAt;
    this.statusLabel = statusLabel;
  }
}

export function toSuppressionLedgerView(item: SuppressionLedger): SuppressionLedgerView {
  return new SuppressionLedgerView(
    text.truncate(item.code, 64),
    item.label,
    item.phone,
    String(item.quantity),
    item.externalRef,
    item.maximum.toFixed(2),
    String(item.limit),
    String(item.clicks),
    String(item.updatedAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toSuppressionLedgerViews(items: SuppressionLedger[]): SuppressionLedgerView[] {
  const views: SuppressionLedgerView[] = [];
  for (const item of items) {
    views.push(toSuppressionLedgerView(item));
  }
  return views;
}

export function sumSuppressionLedgerView(view: SuppressionLedgerView): number {
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  const parsedMaximum = Number(view.maximum);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximum} is not a number`);
  const parsedLimit = Number(view.limit);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limit} is not a number`);
  return parsedQuantity + parsedMaximum + parsedLimit;
}
