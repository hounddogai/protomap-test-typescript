import * as text from "../../../../kit/text.js";
import { PrimaryPostSnapshot } from "./primary-post-snapshot.js";

/** How screens and exports show a primary post snapshot. */
export class PrimaryPostSnapshotView {
  code: string;
  label: string;
  priority: string;
  amountText: string;
  createdAt: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    priority: string,
    amountText: string,
    createdAt: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.priority = priority;
    this.amountText = amountText;
    this.createdAt = createdAt;
    this.statusLabel = statusLabel;
  }
}

export function toPrimaryPostSnapshotView(item: PrimaryPostSnapshot): PrimaryPostSnapshotView {
  return new PrimaryPostSnapshotView(
    item.code,
    text.truncate(item.label, 64),
    String(item.priority),
    item.amount.toFixed(2),
    String(item.createdAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toPrimaryPostSnapshotViews(items: PrimaryPostSnapshot[]): PrimaryPostSnapshotView[] {
  const views: PrimaryPostSnapshotView[] = [];
  for (const item of items) {
    views.push(toPrimaryPostSnapshotView(item));
  }
  return views;
}

export function sumPrimaryPostSnapshotView(view: PrimaryPostSnapshotView): number {
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  const parsedAmount = Number(view.amountText);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amountText} is not a number`);
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  return parsedPriority + parsedAmount + parsedCreatedAt;
}
