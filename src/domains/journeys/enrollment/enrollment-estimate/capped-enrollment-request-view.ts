import * as text from "../../../../kit/text.js";
import { CappedEnrollmentRequest } from "./capped-enrollment-request.js";

/** How screens and exports show a capped enrollment request. */
export class CappedEnrollmentRequestView {
  code: string;
  title: string;
  sendAtText: string;
  utmSourceText: string;
  nameText: string;
  discount: string;
  quantity: string;
  retriesText: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    sendAtText: string,
    utmSourceText: string,
    nameText: string,
    discount: string,
    quantity: string,
    retriesText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.sendAtText = sendAtText;
    this.utmSourceText = utmSourceText;
    this.nameText = nameText;
    this.discount = discount;
    this.quantity = quantity;
    this.retriesText = retriesText;
    this.statusLabel = statusLabel;
  }
}

export function toCappedEnrollmentRequestView(item: CappedEnrollmentRequest): CappedEnrollmentRequestView {
  return new CappedEnrollmentRequestView(
    text.truncate(item.code, 64),
    text.truncate(item.title, 120),
    String(item.sendAt),
    text.truncate(item.utmSource, 120),
    text.truncate(item.name, 80),
    item.discount.toFixed(2),
    String(item.quantity),
    String(item.retries),
    `${item.status}`.toUpperCase(),
  );
}

export function toCappedEnrollmentRequestViews(items: CappedEnrollmentRequest[]): CappedEnrollmentRequestView[] {
  const views: CappedEnrollmentRequestView[] = [];
  for (const item of items) {
    views.push(toCappedEnrollmentRequestView(item));
  }
  return views;
}

export function sumCappedEnrollmentRequestView(view: CappedEnrollmentRequestView): number {
  const parsedSendAt = Number(view.sendAtText);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAtText} is not a number`);
  const parsedDiscount = Number(view.discount);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discount} is not a number`);
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  return parsedSendAt + parsedDiscount + parsedQuantity;
}
