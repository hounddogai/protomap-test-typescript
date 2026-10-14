import * as text from "../../../../kit/text.js";
import { ModelBudget } from "./model-budget.js";

/** How screens and exports show a model budget. */
export class ModelBudgetView {
  code: string;
  title: string;
  ownerIdText: string;
  summaryText: string;
  createdAtText: string;
  variantText: string;
  capacity: string;
  ceiling: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    ownerIdText: string,
    summaryText: string,
    createdAtText: string,
    variantText: string,
    capacity: string,
    ceiling: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.ownerIdText = ownerIdText;
    this.summaryText = summaryText;
    this.createdAtText = createdAtText;
    this.variantText = variantText;
    this.capacity = capacity;
    this.ceiling = ceiling;
    this.statusLabel = statusLabel;
  }
}

export function toModelBudgetView(item: ModelBudget): ModelBudgetView {
  return new ModelBudgetView(
    item.code,
    text.truncate(item.title, 80),
    item.ownerId,
    item.summary,
    String(item.createdAt),
    item.variant,
    String(item.capacity),
    item.ceiling.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toModelBudgetViews(items: ModelBudget[]): ModelBudgetView[] {
  const views: ModelBudgetView[] = [];
  for (const item of items) {
    views.push(toModelBudgetView(item));
  }
  return views;
}

export function sumModelBudgetView(view: ModelBudgetView): number {
  const parsedCreatedAt = Number(view.createdAtText);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAtText} is not a number`);
  const parsedCapacity = Number(view.capacity);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacity} is not a number`);
  const parsedCeiling = Number(view.ceiling);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceiling} is not a number`);
  return parsedCreatedAt + parsedCapacity + parsedCeiling;
}
