import * as text from "../../../../kit/text.js";
import { BidRuleAllocation } from "./bid-rule-allocation.js";

/** How screens and exports show a bid rule allocation. */
export class BidRuleAllocationView {
  code: string;
  titleText: string;
  bid: string;
  visible: string;
  phoneText: string;
  budgetText: string;
  updatedAtText: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    bid: string,
    visible: string,
    phoneText: string,
    budgetText: string,
    updatedAtText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.bid = bid;
    this.visible = visible;
    this.phoneText = phoneText;
    this.budgetText = budgetText;
    this.updatedAtText = updatedAtText;
    this.statusLabel = statusLabel;
  }
}

export function toBidRuleAllocationView(item: BidRuleAllocation): BidRuleAllocationView {
  return new BidRuleAllocationView(
    text.truncate(item.code, 80),
    item.title,
    item.bid.toFixed(2),
    `${item.visible}`,
    item.phone,
    item.budget.toFixed(2),
    String(item.updatedAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toBidRuleAllocationViews(items: BidRuleAllocation[]): BidRuleAllocationView[] {
  const views: BidRuleAllocationView[] = [];
  for (const item of items) {
    views.push(toBidRuleAllocationView(item));
  }
  return views;
}

export function sumBidRuleAllocationView(view: BidRuleAllocationView): number {
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  const parsedBudget = Number(view.budgetText);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budgetText} is not a number`);
  const parsedUpdatedAt = Number(view.updatedAtText);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAtText} is not a number`);
  return parsedBid + parsedBudget + parsedUpdatedAt;
}
