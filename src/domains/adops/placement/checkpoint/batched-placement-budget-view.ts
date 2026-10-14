import * as text from "../../../../kit/text.js";
import { BatchedPlacementBudget } from "./batched-placement-budget.js";

/** How screens and exports show a batched placement budget. */
export class BatchedPlacementBudgetView {
  code: string;
  nameText: string;
  descriptionText: string;
  journeyId: string;
  sequence: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    descriptionText: string,
    journeyId: string,
    sequence: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.descriptionText = descriptionText;
    this.journeyId = journeyId;
    this.sequence = sequence;
    this.statusLabel = statusLabel;
  }
}

export function toBatchedPlacementBudgetView(item: BatchedPlacementBudget): BatchedPlacementBudgetView {
  return new BatchedPlacementBudgetView(
    item.code,
    item.name,
    text.truncate(item.description, 40),
    item.journeyId,
    String(item.sequence),
    `${item.status}`.toUpperCase(),
  );
}

export function toBatchedPlacementBudgetViews(items: BatchedPlacementBudget[]): BatchedPlacementBudgetView[] {
  const views: BatchedPlacementBudgetView[] = [];
  for (const item of items) {
    views.push(toBatchedPlacementBudgetView(item));
  }
  return views;
}

export function sumBatchedPlacementBudgetView(view: BatchedPlacementBudgetView): number {
  const parsedSequence = Number(view.sequence);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequence} is not a number`);
  return parsedSequence;
}
