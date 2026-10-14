import { PendingSenderRequest } from "./pending-sender-request.js";

/** How screens and exports show a pending sender request. */
export class PendingSenderRequestView {
  codeText: string;
  titleText: string;
  limit: string;
  endsAt: string;
  discountText: string;
  costText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    titleText: string,
    limit: string,
    endsAt: string,
    discountText: string,
    costText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.titleText = titleText;
    this.limit = limit;
    this.endsAt = endsAt;
    this.discountText = discountText;
    this.costText = costText;
    this.statusLabel = statusLabel;
  }
}

export function toPendingSenderRequestView(item: PendingSenderRequest): PendingSenderRequestView {
  return new PendingSenderRequestView(
    item.code,
    item.title,
    String(item.limit),
    String(item.endsAt),
    item.discount.toFixed(2),
    item.cost.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toPendingSenderRequestViews(items: PendingSenderRequest[]): PendingSenderRequestView[] {
  const views: PendingSenderRequestView[] = [];
  for (const item of items) {
    views.push(toPendingSenderRequestView(item));
  }
  return views;
}

export function sumPendingSenderRequestView(view: PendingSenderRequestView): number {
  const parsedLimit = Number(view.limit);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limit} is not a number`);
  const parsedEndsAt = Number(view.endsAt);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAt} is not a number`);
  const parsedDiscount = Number(view.discountText);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discountText} is not a number`);
  return parsedLimit + parsedEndsAt + parsedDiscount;
}
