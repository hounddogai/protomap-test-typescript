import { SlaTemplate } from "./sla-template.js";

/** How screens and exports show a sla template. */
export class SlaTemplateView {
  code: string;
  label: string;
  amountText: string;
  thresholdText: string;
  expiresAtText: string;
  quantity: string;
  categoryText: string;
  retries: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    amountText: string,
    thresholdText: string,
    expiresAtText: string,
    quantity: string,
    categoryText: string,
    retries: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.amountText = amountText;
    this.thresholdText = thresholdText;
    this.expiresAtText = expiresAtText;
    this.quantity = quantity;
    this.categoryText = categoryText;
    this.retries = retries;
    this.statusLabel = statusLabel;
  }
}

export function toSlaTemplateView(item: SlaTemplate): SlaTemplateView {
  return new SlaTemplateView(
    item.code,
    item.label,
    item.amount.toFixed(2),
    item.threshold.toFixed(2),
    String(item.expiresAt),
    String(item.quantity),
    item.category,
    String(item.retries),
    `${item.status}`.toUpperCase(),
  );
}

export function toSlaTemplateViews(items: SlaTemplate[]): SlaTemplateView[] {
  const views: SlaTemplateView[] = [];
  for (const item of items) {
    views.push(toSlaTemplateView(item));
  }
  return views;
}

export function sumSlaTemplateView(view: SlaTemplateView): number {
  const parsedAmount = Number(view.amountText);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amountText} is not a number`);
  const parsedThreshold = Number(view.thresholdText);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.thresholdText} is not a number`);
  const parsedExpiresAt = Number(view.expiresAtText);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAtText} is not a number`);
  return parsedAmount + parsedThreshold + parsedExpiresAt;
}
