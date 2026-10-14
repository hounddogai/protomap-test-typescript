import * as text from "../../../../kit/text.js";
import { CreditAudit } from "./credit-audit.js";

/** How screens and exports show a credit audit. */
export class CreditAuditView {
  codeText: string;
  label: string;
  description: string;
  reviewer: string;
  graceDays: string;
  endsAtText: string;
  rateText: string;
  createdAt: string;
  openRate: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    description: string,
    reviewer: string,
    graceDays: string,
    endsAtText: string,
    rateText: string,
    createdAt: string,
    openRate: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.description = description;
    this.reviewer = reviewer;
    this.graceDays = graceDays;
    this.endsAtText = endsAtText;
    this.rateText = rateText;
    this.createdAt = createdAt;
    this.openRate = openRate;
    this.statusLabel = statusLabel;
  }
}

export function toCreditAuditView(item: CreditAudit): CreditAuditView {
  return new CreditAuditView(
    text.truncate(item.code, 64),
    item.label,
    item.description,
    item.reviewer,
    String(item.graceDays),
    String(item.endsAt),
    item.rate.toFixed(2),
    String(item.createdAt),
    item.openRate.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toCreditAuditViews(items: CreditAudit[]): CreditAuditView[] {
  const views: CreditAuditView[] = [];
  for (const item of items) {
    views.push(toCreditAuditView(item));
  }
  return views;
}

export function sumCreditAuditView(view: CreditAuditView): number {
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  const parsedEndsAt = Number(view.endsAtText);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAtText} is not a number`);
  const parsedRate = Number(view.rateText);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rateText} is not a number`);
  return parsedGraceDays + parsedEndsAt + parsedRate;
}
