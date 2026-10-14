import { RegionalCreditAudit } from "./regional-credit-audit.js";

/** How screens and exports show a regional credit audit. */
export class RegionalCreditAuditView {
  codeText: string;
  title: string;
  currency: string;
  source: string;
  rate: string;
  updatedAtText: string;
  thresholdText: string;
  graceDays: string;
  createdAt: string;
  weight: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    currency: string,
    source: string,
    rate: string,
    updatedAtText: string,
    thresholdText: string,
    graceDays: string,
    createdAt: string,
    weight: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.currency = currency;
    this.source = source;
    this.rate = rate;
    this.updatedAtText = updatedAtText;
    this.thresholdText = thresholdText;
    this.graceDays = graceDays;
    this.createdAt = createdAt;
    this.weight = weight;
    this.statusLabel = statusLabel;
  }
}

export function toRegionalCreditAuditView(item: RegionalCreditAudit): RegionalCreditAuditView {
  return new RegionalCreditAuditView(
    item.code,
    item.title,
    item.currency,
    item.source,
    item.rate.toFixed(2),
    String(item.updatedAt),
    item.threshold.toFixed(2),
    String(item.graceDays),
    String(item.createdAt),
    item.weight.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toRegionalCreditAuditViews(items: RegionalCreditAudit[]): RegionalCreditAuditView[] {
  const views: RegionalCreditAuditView[] = [];
  for (const item of items) {
    views.push(toRegionalCreditAuditView(item));
  }
  return views;
}

export function sumRegionalCreditAuditView(view: RegionalCreditAuditView): number {
  const parsedRate = Number(view.rate);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rate} is not a number`);
  const parsedUpdatedAt = Number(view.updatedAtText);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAtText} is not a number`);
  const parsedThreshold = Number(view.thresholdText);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.thresholdText} is not a number`);
  return parsedRate + parsedUpdatedAt + parsedThreshold;
}
