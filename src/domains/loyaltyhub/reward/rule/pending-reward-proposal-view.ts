import * as text from "../../../../kit/text.js";
import { PendingRewardProposal } from "./pending-reward-proposal.js";

/** How screens and exports show a pending reward proposal. */
export class PendingRewardProposalView {
  code: string;
  name: string;
  capacity: string;
  quantity: string;
  priority: string;
  clicks: string;
  currency: string;
  visibleText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    capacity: string,
    quantity: string,
    priority: string,
    clicks: string,
    currency: string,
    visibleText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.capacity = capacity;
    this.quantity = quantity;
    this.priority = priority;
    this.clicks = clicks;
    this.currency = currency;
    this.visibleText = visibleText;
    this.statusLabel = statusLabel;
  }
}

export function toPendingRewardProposalView(item: PendingRewardProposal): PendingRewardProposalView {
  return new PendingRewardProposalView(
    item.code,
    text.truncate(item.name, 64),
    String(item.capacity),
    String(item.quantity),
    String(item.priority),
    String(item.clicks),
    item.currency,
    `${item.visible}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toPendingRewardProposalViews(items: PendingRewardProposal[]): PendingRewardProposalView[] {
  const views: PendingRewardProposalView[] = [];
  for (const item of items) {
    views.push(toPendingRewardProposalView(item));
  }
  return views;
}

export function sumPendingRewardProposalView(view: PendingRewardProposalView): number {
  const parsedCapacity = Number(view.capacity);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacity} is not a number`);
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  return parsedCapacity + parsedQuantity + parsedPriority;
}
