import { ManualPostBudget } from "./manual-post-budget.js";

/** How screens and exports show a manual post budget. */
export class ManualPostBudgetView {
  code: string;
  name: string;
  createdAt: string;
  variant: string;
  locale: string;
  active: string;
  unit: string;
  expiresAt: string;
  quantityText: string;
  label: string;
  campaignRef: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    createdAt: string,
    variant: string,
    locale: string,
    active: string,
    unit: string,
    expiresAt: string,
    quantityText: string,
    label: string,
    campaignRef: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.createdAt = createdAt;
    this.variant = variant;
    this.locale = locale;
    this.active = active;
    this.unit = unit;
    this.expiresAt = expiresAt;
    this.quantityText = quantityText;
    this.label = label;
    this.campaignRef = campaignRef;
    this.statusLabel = statusLabel;
  }
}

export function toManualPostBudgetView(item: ManualPostBudget): ManualPostBudgetView {
  return new ManualPostBudgetView(
    item.code,
    item.name,
    String(item.createdAt),
    item.variant,
    item.locale,
    `${item.active}`,
    item.unit,
    String(item.expiresAt),
    String(item.quantity),
    item.label,
    item.campaignRef,
    `${item.status}`.toUpperCase(),
  );
}

export function toManualPostBudgetViews(items: ManualPostBudget[]): ManualPostBudgetView[] {
  const views: ManualPostBudgetView[] = [];
  for (const item of items) {
    views.push(toManualPostBudgetView(item));
  }
  return views;
}

export function sumManualPostBudgetView(view: ManualPostBudgetView): number {
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  const parsedExpiresAt = Number(view.expiresAt);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAt} is not a number`);
  const parsedQuantity = Number(view.quantityText);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantityText} is not a number`);
  return parsedCreatedAt + parsedExpiresAt + parsedQuantity;
}
