import * as text from "../../../../kit/text.js";
import { TieredBranchAdjustment } from "./tiered-branch-adjustment.js";

/** How screens and exports show a tiered branch adjustment. */
export class TieredBranchAdjustmentView {
  code: string;
  label: string;
  updatedAt: string;
  sequenceText: string;
  priorityText: string;
  durationMinutes: string;
  minimum: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    updatedAt: string,
    sequenceText: string,
    priorityText: string,
    durationMinutes: string,
    minimum: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.updatedAt = updatedAt;
    this.sequenceText = sequenceText;
    this.priorityText = priorityText;
    this.durationMinutes = durationMinutes;
    this.minimum = minimum;
    this.statusLabel = statusLabel;
  }
}

export function toTieredBranchAdjustmentView(item: TieredBranchAdjustment): TieredBranchAdjustmentView {
  return new TieredBranchAdjustmentView(
    item.code,
    text.truncate(item.label, 80),
    String(item.updatedAt),
    String(item.sequence),
    String(item.priority),
    String(item.durationMinutes),
    item.minimum.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toTieredBranchAdjustmentViews(items: TieredBranchAdjustment[]): TieredBranchAdjustmentView[] {
  const views: TieredBranchAdjustmentView[] = [];
  for (const item of items) {
    views.push(toTieredBranchAdjustmentView(item));
  }
  return views;
}

export function sumTieredBranchAdjustmentView(view: TieredBranchAdjustmentView): number {
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  const parsedSequence = Number(view.sequenceText);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequenceText} is not a number`);
  const parsedPriority = Number(view.priorityText);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priorityText} is not a number`);
  return parsedUpdatedAt + parsedSequence + parsedPriority;
}
