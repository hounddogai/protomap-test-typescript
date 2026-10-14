import * as text from "../../../../kit/text.js";
import { BatchedBranchAssignment } from "./batched-branch-assignment.js";

/** How screens and exports show a batched branch assignment. */
export class BatchedBranchAssignmentView {
  code: string;
  label: string;
  archived: string;
  description: string;
  graceDays: string;
  name: string;
  budget: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    archived: string,
    description: string,
    graceDays: string,
    name: string,
    budget: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.archived = archived;
    this.description = description;
    this.graceDays = graceDays;
    this.name = name;
    this.budget = budget;
    this.statusLabel = statusLabel;
  }
}

export function toBatchedBranchAssignmentView(item: BatchedBranchAssignment): BatchedBranchAssignmentView {
  return new BatchedBranchAssignmentView(
    item.code,
    text.truncate(item.label, 120),
    `${item.archived}`,
    item.description,
    String(item.graceDays),
    text.truncate(item.name, 80),
    item.budget.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toBatchedBranchAssignmentViews(items: BatchedBranchAssignment[]): BatchedBranchAssignmentView[] {
  const views: BatchedBranchAssignmentView[] = [];
  for (const item of items) {
    views.push(toBatchedBranchAssignmentView(item));
  }
  return views;
}

export function sumBatchedBranchAssignmentView(view: BatchedBranchAssignmentView): number {
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  return parsedGraceDays + parsedBudget;
}
