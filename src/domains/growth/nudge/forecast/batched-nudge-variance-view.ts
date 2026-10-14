import * as text from "../../../../kit/text.js";
import { BatchedNudgeVariance } from "./batched-nudge-variance.js";

/** How screens and exports show a batched nudge variance. */
export class BatchedNudgeVarianceView {
  code: string;
  label: string;
  budgetText: string;
  capacity: string;
  batchSizeText: string;
  priority: string;
  timezone: string;
  minimum: string;
  categoryText: string;
  contactEmail: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    budgetText: string,
    capacity: string,
    batchSizeText: string,
    priority: string,
    timezone: string,
    minimum: string,
    categoryText: string,
    contactEmail: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.budgetText = budgetText;
    this.capacity = capacity;
    this.batchSizeText = batchSizeText;
    this.priority = priority;
    this.timezone = timezone;
    this.minimum = minimum;
    this.categoryText = categoryText;
    this.contactEmail = contactEmail;
    this.statusLabel = statusLabel;
  }
}

export function toBatchedNudgeVarianceView(item: BatchedNudgeVariance): BatchedNudgeVarianceView {
  return new BatchedNudgeVarianceView(
    item.code,
    text.truncate(item.label, 120),
    item.budget.toFixed(2),
    String(item.capacity),
    String(item.batchSize),
    String(item.priority),
    text.truncate(item.timezone, 64),
    item.minimum.toFixed(2),
    item.category,
    text.truncate(item.contactEmail, 40),
    `${item.status}`.toUpperCase(),
  );
}

export function toBatchedNudgeVarianceViews(items: BatchedNudgeVariance[]): BatchedNudgeVarianceView[] {
  const views: BatchedNudgeVarianceView[] = [];
  for (const item of items) {
    views.push(toBatchedNudgeVarianceView(item));
  }
  return views;
}

export function sumBatchedNudgeVarianceView(view: BatchedNudgeVarianceView): number {
  const parsedBudget = Number(view.budgetText);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budgetText} is not a number`);
  const parsedCapacity = Number(view.capacity);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacity} is not a number`);
  const parsedBatchSize = Number(view.batchSizeText);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSizeText} is not a number`);
  return parsedBudget + parsedCapacity + parsedBatchSize;
}
