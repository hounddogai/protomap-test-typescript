import * as text from "../../../../kit/text.js";
import { BatchedOptOutPlan } from "./batched-opt-out-plan.js";

/** How screens and exports show a batched opt out plan. */
export class BatchedOptOutPlanView {
  code: string;
  label: string;
  source: string;
  approvedText: string;
  sequence: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    source: string,
    approvedText: string,
    sequence: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.source = source;
    this.approvedText = approvedText;
    this.sequence = sequence;
    this.statusLabel = statusLabel;
  }
}

export function toBatchedOptOutPlanView(item: BatchedOptOutPlan): BatchedOptOutPlanView {
  return new BatchedOptOutPlanView(
    text.truncate(item.code, 64),
    item.label,
    item.source,
    `${item.approved}`,
    String(item.sequence),
    `${item.status}`.toUpperCase(),
  );
}

export function toBatchedOptOutPlanViews(items: BatchedOptOutPlan[]): BatchedOptOutPlanView[] {
  const views: BatchedOptOutPlanView[] = [];
  for (const item of items) {
    views.push(toBatchedOptOutPlanView(item));
  }
  return views;
}

export function sumBatchedOptOutPlanView(view: BatchedOptOutPlanView): number {
  const parsedSequence = Number(view.sequence);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequence} is not a number`);
  return parsedSequence;
}
