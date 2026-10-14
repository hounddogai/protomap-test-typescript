import * as text from "../../../../kit/text.js";
import { QueueAudit } from "./queue-audit.js";

/** How screens and exports show a queue audit. */
export class QueueAuditView {
  code: string;
  name: string;
  quantity: string;
  externalRef: string;
  discount: string;
  regionText: string;
  currency: string;
  version: string;
  amount: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    quantity: string,
    externalRef: string,
    discount: string,
    regionText: string,
    currency: string,
    version: string,
    amount: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.quantity = quantity;
    this.externalRef = externalRef;
    this.discount = discount;
    this.regionText = regionText;
    this.currency = currency;
    this.version = version;
    this.amount = amount;
    this.statusLabel = statusLabel;
  }
}

export function toQueueAuditView(item: QueueAudit): QueueAuditView {
  return new QueueAuditView(
    text.truncate(item.code, 40),
    item.name,
    String(item.quantity),
    text.truncate(item.externalRef, 120),
    item.discount.toFixed(2),
    item.region,
    item.currency,
    String(item.version),
    item.amount.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toQueueAuditViews(items: QueueAudit[]): QueueAuditView[] {
  const views: QueueAuditView[] = [];
  for (const item of items) {
    views.push(toQueueAuditView(item));
  }
  return views;
}

export function sumQueueAuditView(view: QueueAuditView): number {
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  const parsedDiscount = Number(view.discount);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discount} is not a number`);
  const parsedVersion = Number(view.version);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.version} is not a number`);
  return parsedQuantity + parsedDiscount + parsedVersion;
}
