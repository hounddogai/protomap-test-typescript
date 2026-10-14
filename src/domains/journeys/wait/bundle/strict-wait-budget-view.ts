import * as text from "../../../../kit/text.js";
import { StrictWaitBudget } from "./strict-wait-budget.js";

/** How screens and exports show a strict wait budget. */
export class StrictWaitBudgetView {
  code: string;
  titleText: string;
  batchSize: string;
  createdAt: string;
  weight: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    batchSize: string,
    createdAt: string,
    weight: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.batchSize = batchSize;
    this.createdAt = createdAt;
    this.weight = weight;
    this.statusLabel = statusLabel;
  }
}

export function toStrictWaitBudgetView(item: StrictWaitBudget): StrictWaitBudgetView {
  return new StrictWaitBudgetView(
    item.code,
    text.truncate(item.title, 40),
    String(item.batchSize),
    String(item.createdAt),
    item.weight.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toStrictWaitBudgetViews(items: StrictWaitBudget[]): StrictWaitBudgetView[] {
  const views: StrictWaitBudgetView[] = [];
  for (const item of items) {
    views.push(toStrictWaitBudgetView(item));
  }
  return views;
}

export function sumStrictWaitBudgetView(view: StrictWaitBudgetView): number {
  const parsedBatchSize = Number(view.batchSize);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSize} is not a number`);
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  const parsedWeight = Number(view.weight);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weight} is not a number`);
  return parsedBatchSize + parsedCreatedAt + parsedWeight;
}
