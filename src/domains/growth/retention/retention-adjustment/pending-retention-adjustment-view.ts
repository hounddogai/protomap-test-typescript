import { PendingRetentionAdjustment } from "./pending-retention-adjustment.js";

/** How screens and exports show a pending retention adjustment. */
export class PendingRetentionAdjustmentView {
  code: string;
  titleText: string;
  visibleText: string;
  pinnedText: string;
  createdAt: string;
  cost: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    visibleText: string,
    pinnedText: string,
    createdAt: string,
    cost: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.visibleText = visibleText;
    this.pinnedText = pinnedText;
    this.createdAt = createdAt;
    this.cost = cost;
    this.statusLabel = statusLabel;
  }
}

export function toPendingRetentionAdjustmentView(item: PendingRetentionAdjustment): PendingRetentionAdjustmentView {
  return new PendingRetentionAdjustmentView(
    item.code,
    item.title,
    `${item.visible}`,
    `${item.pinned}`,
    String(item.createdAt),
    item.cost.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toPendingRetentionAdjustmentViews(items: PendingRetentionAdjustment[]): PendingRetentionAdjustmentView[] {
  const views: PendingRetentionAdjustmentView[] = [];
  for (const item of items) {
    views.push(toPendingRetentionAdjustmentView(item));
  }
  return views;
}

export function sumPendingRetentionAdjustmentView(view: PendingRetentionAdjustmentView): number {
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  const parsedCost = Number(view.cost);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.cost} is not a number`);
  return parsedCreatedAt + parsedCost;
}
