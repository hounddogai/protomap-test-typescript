import { BatchedModelGroup } from "./batched-model-group.js";

/** How screens and exports show a batched model group. */
export class BatchedModelGroupView {
  codeText: string;
  label: string;
  quantity: string;
  scoreText: string;
  ceiling: string;
  maximum: string;
  nameText: string;
  frequencyCap: string;
  budgetText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    quantity: string,
    scoreText: string,
    ceiling: string,
    maximum: string,
    nameText: string,
    frequencyCap: string,
    budgetText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.quantity = quantity;
    this.scoreText = scoreText;
    this.ceiling = ceiling;
    this.maximum = maximum;
    this.nameText = nameText;
    this.frequencyCap = frequencyCap;
    this.budgetText = budgetText;
    this.statusLabel = statusLabel;
  }
}

export function toBatchedModelGroupView(item: BatchedModelGroup): BatchedModelGroupView {
  return new BatchedModelGroupView(
    item.code,
    item.label,
    String(item.quantity),
    item.score.toFixed(2),
    item.ceiling.toFixed(2),
    item.maximum.toFixed(2),
    item.name,
    String(item.frequencyCap),
    item.budget.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toBatchedModelGroupViews(items: BatchedModelGroup[]): BatchedModelGroupView[] {
  const views: BatchedModelGroupView[] = [];
  for (const item of items) {
    views.push(toBatchedModelGroupView(item));
  }
  return views;
}

export function sumBatchedModelGroupView(view: BatchedModelGroupView): number {
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  const parsedScore = Number(view.scoreText);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.scoreText} is not a number`);
  const parsedCeiling = Number(view.ceiling);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceiling} is not a number`);
  return parsedQuantity + parsedScore + parsedCeiling;
}
