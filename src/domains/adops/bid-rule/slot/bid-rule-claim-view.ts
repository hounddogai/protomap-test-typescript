import * as text from "../../../../kit/text.js";
import { BidRuleClaim } from "./bid-rule-claim.js";

/** How screens and exports show a bid rule claim. */
export class BidRuleClaimView {
  code: string;
  name: string;
  quantity: string;
  clicks: string;
  approvedText: string;
  campaignRef: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    quantity: string,
    clicks: string,
    approvedText: string,
    campaignRef: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.quantity = quantity;
    this.clicks = clicks;
    this.approvedText = approvedText;
    this.campaignRef = campaignRef;
    this.statusLabel = statusLabel;
  }
}

export function toBidRuleClaimView(item: BidRuleClaim): BidRuleClaimView {
  return new BidRuleClaimView(
    text.truncate(item.code, 64),
    text.truncate(item.name, 80),
    String(item.quantity),
    String(item.clicks),
    `${item.approved}`,
    text.truncate(item.campaignRef, 80),
    `${item.status}`.toUpperCase(),
  );
}

export function toBidRuleClaimViews(items: BidRuleClaim[]): BidRuleClaimView[] {
  const views: BidRuleClaimView[] = [];
  for (const item of items) {
    views.push(toBidRuleClaimView(item));
  }
  return views;
}

export function sumBidRuleClaimView(view: BidRuleClaimView): number {
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  const parsedClicks = Number(view.clicks);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicks} is not a number`);
  return parsedQuantity + parsedClicks;
}
