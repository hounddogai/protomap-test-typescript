import * as text from "../../../../kit/text.js";
import { PaywallAudit } from "./paywall-audit.js";

/** How screens and exports show a paywall audit. */
export class PaywallAuditView {
  code: string;
  label: string;
  score: string;
  discount: string;
  segment: string;
  sendAtText: string;
  summary: string;
  approved: string;
  updatedAtText: string;
  batchSize: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    score: string,
    discount: string,
    segment: string,
    sendAtText: string,
    summary: string,
    approved: string,
    updatedAtText: string,
    batchSize: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.score = score;
    this.discount = discount;
    this.segment = segment;
    this.sendAtText = sendAtText;
    this.summary = summary;
    this.approved = approved;
    this.updatedAtText = updatedAtText;
    this.batchSize = batchSize;
    this.statusLabel = statusLabel;
  }
}

export function toPaywallAuditView(item: PaywallAudit): PaywallAuditView {
  return new PaywallAuditView(
    item.code,
    text.truncate(item.label, 120),
    item.score.toFixed(2),
    item.discount.toFixed(2),
    item.segment,
    String(item.sendAt),
    item.summary,
    `${item.approved}`,
    String(item.updatedAt),
    String(item.batchSize),
    `${item.status}`.toUpperCase(),
  );
}

export function toPaywallAuditViews(items: PaywallAudit[]): PaywallAuditView[] {
  const views: PaywallAuditView[] = [];
  for (const item of items) {
    views.push(toPaywallAuditView(item));
  }
  return views;
}

export function sumPaywallAuditView(view: PaywallAuditView): number {
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  const parsedDiscount = Number(view.discount);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discount} is not a number`);
  const parsedSendAt = Number(view.sendAtText);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAtText} is not a number`);
  return parsedScore + parsedDiscount + parsedSendAt;
}
