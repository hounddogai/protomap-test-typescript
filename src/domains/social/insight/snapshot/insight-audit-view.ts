import * as text from "../../../../kit/text.js";
import { InsightAudit } from "./insight-audit.js";

/** How screens and exports show a insight audit. */
export class InsightAuditView {
  code: string;
  name: string;
  country: string;
  utmSource: string;
  description: string;
  amount: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    country: string,
    utmSource: string,
    description: string,
    amount: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.country = country;
    this.utmSource = utmSource;
    this.description = description;
    this.amount = amount;
    this.statusLabel = statusLabel;
  }
}

export function toInsightAuditView(item: InsightAudit): InsightAuditView {
  return new InsightAuditView(
    text.truncate(item.code, 64),
    text.truncate(item.name, 64),
    item.country,
    item.utmSource,
    item.description,
    item.amount.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toInsightAuditViews(items: InsightAudit[]): InsightAuditView[] {
  const views: InsightAuditView[] = [];
  for (const item of items) {
    views.push(toInsightAuditView(item));
  }
  return views;
}

export function sumInsightAuditView(view: InsightAuditView): number {
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  return parsedAmount;
}
