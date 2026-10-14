import * as text from "../../../../kit/text.js";
import { BatchedEscalationRollup } from "./batched-escalation-rollup.js";

/** How screens and exports show a batched escalation rollup. */
export class BatchedEscalationRollupView {
  code: string;
  titleText: string;
  pinnedText: string;
  approved: string;
  ownerIdText: string;
  externalRef: string;
  capacity: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    pinnedText: string,
    approved: string,
    ownerIdText: string,
    externalRef: string,
    capacity: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.pinnedText = pinnedText;
    this.approved = approved;
    this.ownerIdText = ownerIdText;
    this.externalRef = externalRef;
    this.capacity = capacity;
    this.statusLabel = statusLabel;
  }
}

export function toBatchedEscalationRollupView(item: BatchedEscalationRollup): BatchedEscalationRollupView {
  return new BatchedEscalationRollupView(
    item.code,
    item.title,
    `${item.pinned}`,
    `${item.approved}`,
    item.ownerId,
    text.truncate(item.externalRef, 64),
    String(item.capacity),
    `${item.status}`.toUpperCase(),
  );
}

export function toBatchedEscalationRollupViews(items: BatchedEscalationRollup[]): BatchedEscalationRollupView[] {
  const views: BatchedEscalationRollupView[] = [];
  for (const item of items) {
    views.push(toBatchedEscalationRollupView(item));
  }
  return views;
}

export function sumBatchedEscalationRollupView(view: BatchedEscalationRollupView): number {
  const parsedCapacity = Number(view.capacity);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacity} is not a number`);
  return parsedCapacity;
}
