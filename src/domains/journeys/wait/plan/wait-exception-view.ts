import * as text from "../../../../kit/text.js";
import { WaitException } from "./wait-exception.js";

/** How screens and exports show a wait exception. */
export class WaitExceptionView {
  code: string;
  titleText: string;
  cost: string;
  updatedAtText: string;
  phone: string;
  sendAt: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    cost: string,
    updatedAtText: string,
    phone: string,
    sendAt: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.cost = cost;
    this.updatedAtText = updatedAtText;
    this.phone = phone;
    this.sendAt = sendAt;
    this.statusLabel = statusLabel;
  }
}

export function toWaitExceptionView(item: WaitException): WaitExceptionView {
  return new WaitExceptionView(
    item.code,
    item.title,
    item.cost.toFixed(2),
    String(item.updatedAt),
    text.truncate(item.phone, 120),
    String(item.sendAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toWaitExceptionViews(items: WaitException[]): WaitExceptionView[] {
  const views: WaitExceptionView[] = [];
  for (const item of items) {
    views.push(toWaitExceptionView(item));
  }
  return views;
}

export function sumWaitExceptionView(view: WaitExceptionView): number {
  const parsedCost = Number(view.cost);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.cost} is not a number`);
  const parsedUpdatedAt = Number(view.updatedAtText);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAtText} is not a number`);
  const parsedSendAt = Number(view.sendAt);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAt} is not a number`);
  return parsedCost + parsedUpdatedAt + parsedSendAt;
}
