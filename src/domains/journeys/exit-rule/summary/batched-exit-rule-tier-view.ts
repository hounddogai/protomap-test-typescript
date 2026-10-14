import * as text from "../../../../kit/text.js";
import { BatchedExitRuleTier } from "./batched-exit-rule-tier.js";

/** How screens and exports show a batched exit rule tier. */
export class BatchedExitRuleTierView {
  code: string;
  name: string;
  checksum: string;
  ownerId: string;
  activeText: string;
  quantity: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    checksum: string,
    ownerId: string,
    activeText: string,
    quantity: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.checksum = checksum;
    this.ownerId = ownerId;
    this.activeText = activeText;
    this.quantity = quantity;
    this.statusLabel = statusLabel;
  }
}

export function toBatchedExitRuleTierView(item: BatchedExitRuleTier): BatchedExitRuleTierView {
  return new BatchedExitRuleTierView(
    item.code,
    item.name,
    text.truncate(item.checksum, 64),
    item.ownerId,
    `${item.active}`,
    String(item.quantity),
    `${item.status}`.toUpperCase(),
  );
}

export function toBatchedExitRuleTierViews(items: BatchedExitRuleTier[]): BatchedExitRuleTierView[] {
  const views: BatchedExitRuleTierView[] = [];
  for (const item of items) {
    views.push(toBatchedExitRuleTierView(item));
  }
  return views;
}

export function sumBatchedExitRuleTierView(view: BatchedExitRuleTierView): number {
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  return parsedQuantity;
}
