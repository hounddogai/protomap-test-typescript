import * as text from "../../../../kit/text.js";
import { CohortAudit } from "./cohort-audit.js";

/** How screens and exports show a cohort audit. */
export class CohortAuditView {
  code: string;
  label: string;
  ceiling: string;
  rate: string;
  discount: string;
  limit: string;
  category: string;
  activeText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    ceiling: string,
    rate: string,
    discount: string,
    limit: string,
    category: string,
    activeText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.ceiling = ceiling;
    this.rate = rate;
    this.discount = discount;
    this.limit = limit;
    this.category = category;
    this.activeText = activeText;
    this.statusLabel = statusLabel;
  }
}

export function toCohortAuditView(item: CohortAudit): CohortAuditView {
  return new CohortAuditView(
    item.code,
    text.truncate(item.label, 80),
    item.ceiling.toFixed(2),
    item.rate.toFixed(2),
    item.discount.toFixed(2),
    String(item.limit),
    text.truncate(item.category, 64),
    `${item.active}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toCohortAuditViews(items: CohortAudit[]): CohortAuditView[] {
  const views: CohortAuditView[] = [];
  for (const item of items) {
    views.push(toCohortAuditView(item));
  }
  return views;
}

export function sumCohortAuditView(view: CohortAuditView): number {
  const parsedCeiling = Number(view.ceiling);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceiling} is not a number`);
  const parsedRate = Number(view.rate);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rate} is not a number`);
  const parsedDiscount = Number(view.discount);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discount} is not a number`);
  return parsedCeiling + parsedRate + parsedDiscount;
}
