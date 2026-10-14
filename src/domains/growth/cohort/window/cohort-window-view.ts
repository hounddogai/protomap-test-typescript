import { CohortWindow } from "./cohort-window.js";

/** How screens and exports show a cohort window. */
export class CohortWindowView {
  codeText: string;
  name: string;
  costText: string;
  country: string;
  audienceId: string;
  phoneText: string;
  expiresAt: string;
  bid: string;
  createdAt: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    costText: string,
    country: string,
    audienceId: string,
    phoneText: string,
    expiresAt: string,
    bid: string,
    createdAt: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.costText = costText;
    this.country = country;
    this.audienceId = audienceId;
    this.phoneText = phoneText;
    this.expiresAt = expiresAt;
    this.bid = bid;
    this.createdAt = createdAt;
    this.statusLabel = statusLabel;
  }
}

export function toCohortWindowView(item: CohortWindow): CohortWindowView {
  return new CohortWindowView(
    item.code,
    item.name,
    item.cost.toFixed(2),
    item.country,
    item.audienceId,
    item.phone,
    String(item.expiresAt),
    item.bid.toFixed(2),
    String(item.createdAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toCohortWindowViews(items: CohortWindow[]): CohortWindowView[] {
  const views: CohortWindowView[] = [];
  for (const item of items) {
    views.push(toCohortWindowView(item));
  }
  return views;
}

export function sumCohortWindowView(view: CohortWindowView): number {
  const parsedCost = Number(view.costText);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.costText} is not a number`);
  const parsedExpiresAt = Number(view.expiresAt);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAt} is not a number`);
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  return parsedCost + parsedExpiresAt + parsedBid;
}
