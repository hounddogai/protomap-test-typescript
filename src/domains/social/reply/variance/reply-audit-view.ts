import * as text from "../../../../kit/text.js";
import { ReplyAudit } from "./reply-audit.js";

/** How screens and exports show a reply audit. */
export class ReplyAuditView {
  code: string;
  title: string;
  weight: string;
  discount: string;
  contactEmailText: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    weight: string,
    discount: string,
    contactEmailText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.weight = weight;
    this.discount = discount;
    this.contactEmailText = contactEmailText;
    this.statusLabel = statusLabel;
  }
}

export function toReplyAuditView(item: ReplyAudit): ReplyAuditView {
  return new ReplyAuditView(
    text.truncate(item.code, 64),
    text.truncate(item.title, 64),
    item.weight.toFixed(2),
    item.discount.toFixed(2),
    item.contactEmail,
    `${item.status}`.toUpperCase(),
  );
}

export function toReplyAuditViews(items: ReplyAudit[]): ReplyAuditView[] {
  const views: ReplyAuditView[] = [];
  for (const item of items) {
    views.push(toReplyAuditView(item));
  }
  return views;
}

export function sumReplyAuditView(view: ReplyAuditView): number {
  const parsedWeight = Number(view.weight);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weight} is not a number`);
  const parsedDiscount = Number(view.discount);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discount} is not a number`);
  return parsedWeight + parsedDiscount;
}
