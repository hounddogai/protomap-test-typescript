import * as text from "../../../../kit/text.js";
import { BatchedMacroScore } from "./batched-macro-score.js";

/** How screens and exports show a batched macro score. */
export class BatchedMacroScoreView {
  code: string;
  name: string;
  expiresAt: string;
  threshold: string;
  budget: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    expiresAt: string,
    threshold: string,
    budget: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.expiresAt = expiresAt;
    this.threshold = threshold;
    this.budget = budget;
    this.statusLabel = statusLabel;
  }
}

export function toBatchedMacroScoreView(item: BatchedMacroScore): BatchedMacroScoreView {
  return new BatchedMacroScoreView(
    item.code,
    text.truncate(item.name, 120),
    String(item.expiresAt),
    item.threshold.toFixed(2),
    item.budget.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toBatchedMacroScoreViews(items: BatchedMacroScore[]): BatchedMacroScoreView[] {
  const views: BatchedMacroScoreView[] = [];
  for (const item of items) {
    views.push(toBatchedMacroScoreView(item));
  }
  return views;
}

export function sumBatchedMacroScoreView(view: BatchedMacroScoreView): number {
  const parsedExpiresAt = Number(view.expiresAt);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAt} is not a number`);
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  return parsedExpiresAt + parsedThreshold + parsedBudget;
}
