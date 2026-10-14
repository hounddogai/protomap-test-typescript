import * as text from "../../../../kit/text.js";
import { BranchAllocation } from "./branch-allocation.js";

/** How screens and exports show a branch allocation. */
export class BranchAllocationView {
  code: string;
  name: string;
  quantity: string;
  limitText: string;
  variant: string;
  updatedAt: string;
  weight: string;
  category: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    quantity: string,
    limitText: string,
    variant: string,
    updatedAt: string,
    weight: string,
    category: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.quantity = quantity;
    this.limitText = limitText;
    this.variant = variant;
    this.updatedAt = updatedAt;
    this.weight = weight;
    this.category = category;
    this.statusLabel = statusLabel;
  }
}

export function toBranchAllocationView(item: BranchAllocation): BranchAllocationView {
  return new BranchAllocationView(
    text.truncate(item.code, 120),
    text.truncate(item.name, 40),
    String(item.quantity),
    String(item.limit),
    item.variant,
    String(item.updatedAt),
    item.weight.toFixed(2),
    item.category,
    `${item.status}`.toUpperCase(),
  );
}

export function toBranchAllocationViews(items: BranchAllocation[]): BranchAllocationView[] {
  const views: BranchAllocationView[] = [];
  for (const item of items) {
    views.push(toBranchAllocationView(item));
  }
  return views;
}

export function sumBranchAllocationView(view: BranchAllocationView): number {
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  const parsedLimit = Number(view.limitText);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limitText} is not a number`);
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  return parsedQuantity + parsedLimit + parsedUpdatedAt;
}
