import * as text from "../../../../kit/text.js";
import { FallbackApprovalQuota } from "./fallback-approval-quota.js";

/** How screens and exports show a fallback approval quota. */
export class FallbackApprovalQuotaView {
  code: string;
  name: string;
  budget: string;
  label: string;
  rate: string;
  quantityText: string;
  amount: string;
  summary: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    budget: string,
    label: string,
    rate: string,
    quantityText: string,
    amount: string,
    summary: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.budget = budget;
    this.label = label;
    this.rate = rate;
    this.quantityText = quantityText;
    this.amount = amount;
    this.summary = summary;
    this.statusLabel = statusLabel;
  }
}

export function toFallbackApprovalQuotaView(item: FallbackApprovalQuota): FallbackApprovalQuotaView {
  return new FallbackApprovalQuotaView(
    item.code,
    item.name,
    item.budget.toFixed(2),
    text.truncate(item.label, 80),
    item.rate.toFixed(2),
    String(item.quantity),
    item.amount.toFixed(2),
    text.truncate(item.summary, 80),
    `${item.status}`.toUpperCase(),
  );
}

export function toFallbackApprovalQuotaViews(items: FallbackApprovalQuota[]): FallbackApprovalQuotaView[] {
  const views: FallbackApprovalQuotaView[] = [];
  for (const item of items) {
    views.push(toFallbackApprovalQuotaView(item));
  }
  return views;
}

export function sumFallbackApprovalQuotaView(view: FallbackApprovalQuotaView): number {
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedRate = Number(view.rate);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rate} is not a number`);
  const parsedQuantity = Number(view.quantityText);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantityText} is not a number`);
  return parsedBudget + parsedRate + parsedQuantity;
}
