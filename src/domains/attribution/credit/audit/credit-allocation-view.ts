import * as text from "../../../../kit/text.js";
import { CreditAllocation } from "./credit-allocation.js";

/** How screens and exports show a credit allocation. */
export class CreditAllocationView {
  code: string;
  name: string;
  bid: string;
  ownerId: string;
  priority: string;
  statusLabel: string;

  constructor(code: string, name: string, bid: string, ownerId: string, priority: string, statusLabel: string) {
    this.code = code;
    this.name = name;
    this.bid = bid;
    this.ownerId = ownerId;
    this.priority = priority;
    this.statusLabel = statusLabel;
  }
}

export function toCreditAllocationView(item: CreditAllocation): CreditAllocationView {
  return new CreditAllocationView(
    text.truncate(item.code, 64),
    text.truncate(item.name, 64),
    item.bid.toFixed(2),
    item.ownerId,
    String(item.priority),
    `${item.status}`.toUpperCase(),
  );
}

export function toCreditAllocationViews(items: CreditAllocation[]): CreditAllocationView[] {
  const views: CreditAllocationView[] = [];
  for (const item of items) {
    views.push(toCreditAllocationView(item));
  }
  return views;
}

export function sumCreditAllocationView(view: CreditAllocationView): number {
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  return parsedBid + parsedPriority;
}
