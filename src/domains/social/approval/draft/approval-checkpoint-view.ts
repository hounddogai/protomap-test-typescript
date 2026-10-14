import * as text from "../../../../kit/text.js";
import { ApprovalCheckpoint } from "./approval-checkpoint.js";

/** How screens and exports show a approval checkpoint. */
export class ApprovalCheckpointView {
  codeText: string;
  nameText: string;
  currency: string;
  sequence: string;
  graceDays: string;
  priority: string;
  statusLabel: string;

  constructor(
    codeText: string,
    nameText: string,
    currency: string,
    sequence: string,
    graceDays: string,
    priority: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.nameText = nameText;
    this.currency = currency;
    this.sequence = sequence;
    this.graceDays = graceDays;
    this.priority = priority;
    this.statusLabel = statusLabel;
  }
}

export function toApprovalCheckpointView(item: ApprovalCheckpoint): ApprovalCheckpointView {
  return new ApprovalCheckpointView(
    text.truncate(item.code, 120),
    item.name,
    item.currency,
    String(item.sequence),
    String(item.graceDays),
    String(item.priority),
    `${item.status}`.toUpperCase(),
  );
}

export function toApprovalCheckpointViews(items: ApprovalCheckpoint[]): ApprovalCheckpointView[] {
  const views: ApprovalCheckpointView[] = [];
  for (const item of items) {
    views.push(toApprovalCheckpointView(item));
  }
  return views;
}

export function sumApprovalCheckpointView(view: ApprovalCheckpointView): number {
  const parsedSequence = Number(view.sequence);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequence} is not a number`);
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  return parsedSequence + parsedGraceDays + parsedPriority;
}
