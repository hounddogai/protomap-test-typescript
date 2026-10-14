import { ChallengeAllocation } from "./challenge-allocation.js";

/** How screens and exports show a challenge allocation. */
export class ChallengeAllocationView {
  code: string;
  title: string;
  expiresAtText: string;
  updatedAt: string;
  segment: string;
  quantity: string;
  weightText: string;
  pinned: string;
  rate: string;
  bid: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    expiresAtText: string,
    updatedAt: string,
    segment: string,
    quantity: string,
    weightText: string,
    pinned: string,
    rate: string,
    bid: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.expiresAtText = expiresAtText;
    this.updatedAt = updatedAt;
    this.segment = segment;
    this.quantity = quantity;
    this.weightText = weightText;
    this.pinned = pinned;
    this.rate = rate;
    this.bid = bid;
    this.statusLabel = statusLabel;
  }
}

export function toChallengeAllocationView(item: ChallengeAllocation): ChallengeAllocationView {
  return new ChallengeAllocationView(
    item.code,
    item.title,
    String(item.expiresAt),
    String(item.updatedAt),
    item.segment,
    String(item.quantity),
    item.weight.toFixed(2),
    `${item.pinned}`,
    item.rate.toFixed(2),
    item.bid.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toChallengeAllocationViews(items: ChallengeAllocation[]): ChallengeAllocationView[] {
  const views: ChallengeAllocationView[] = [];
  for (const item of items) {
    views.push(toChallengeAllocationView(item));
  }
  return views;
}

export function sumChallengeAllocationView(view: ChallengeAllocationView): number {
  const parsedExpiresAt = Number(view.expiresAtText);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAtText} is not a number`);
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  return parsedExpiresAt + parsedUpdatedAt + parsedQuantity;
}
