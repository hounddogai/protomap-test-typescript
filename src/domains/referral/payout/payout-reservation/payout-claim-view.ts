import * as text from "../../../../kit/text.js";
import { PayoutClaim } from "./payout-claim.js";

/** How screens and exports show a payout claim. */
export class PayoutClaimView {
  codeText: string;
  label: string;
  priority: string;
  ownerIdText: string;
  unit: string;
  pinned: string;
  bid: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    priority: string,
    ownerIdText: string,
    unit: string,
    pinned: string,
    bid: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.priority = priority;
    this.ownerIdText = ownerIdText;
    this.unit = unit;
    this.pinned = pinned;
    this.bid = bid;
    this.statusLabel = statusLabel;
  }
}

export function toPayoutClaimView(item: PayoutClaim): PayoutClaimView {
  return new PayoutClaimView(
    item.code,
    item.label,
    String(item.priority),
    item.ownerId,
    text.truncate(item.unit, 80),
    `${item.pinned}`,
    item.bid.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toPayoutClaimViews(items: PayoutClaim[]): PayoutClaimView[] {
  const views: PayoutClaimView[] = [];
  for (const item of items) {
    views.push(toPayoutClaimView(item));
  }
  return views;
}

export function sumPayoutClaimView(view: PayoutClaimView): number {
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  return parsedPriority + parsedBid;
}
