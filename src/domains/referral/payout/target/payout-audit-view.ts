import * as text from "../../../../kit/text.js";
import { PayoutAudit } from "./payout-audit.js";

/** How screens and exports show a payout audit. */
export class PayoutAuditView {
  code: string;
  nameText: string;
  title: string;
  pinned: string;
  audienceId: string;
  approved: string;
  campaignRef: string;
  quantity: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    title: string,
    pinned: string,
    audienceId: string,
    approved: string,
    campaignRef: string,
    quantity: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.title = title;
    this.pinned = pinned;
    this.audienceId = audienceId;
    this.approved = approved;
    this.campaignRef = campaignRef;
    this.quantity = quantity;
    this.statusLabel = statusLabel;
  }
}

export function toPayoutAuditView(item: PayoutAudit): PayoutAuditView {
  return new PayoutAuditView(
    item.code,
    item.name,
    text.truncate(item.title, 64),
    `${item.pinned}`,
    item.audienceId,
    `${item.approved}`,
    text.truncate(item.campaignRef, 64),
    String(item.quantity),
    `${item.status}`.toUpperCase(),
  );
}

export function toPayoutAuditViews(items: PayoutAudit[]): PayoutAuditView[] {
  const views: PayoutAuditView[] = [];
  for (const item of items) {
    views.push(toPayoutAuditView(item));
  }
  return views;
}

export function sumPayoutAuditView(view: PayoutAuditView): number {
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  return parsedQuantity;
}
