import { GlobalPostReservation } from "./global-post-reservation.js";

/** How screens and exports show a global post reservation. */
export class GlobalPostReservationView {
  code: string;
  title: string;
  categoryText: string;
  expiresAt: string;
  versionText: string;
  openRate: string;
  createdAt: string;
  ceiling: string;
  budgetText: string;
  bid: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    categoryText: string,
    expiresAt: string,
    versionText: string,
    openRate: string,
    createdAt: string,
    ceiling: string,
    budgetText: string,
    bid: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.categoryText = categoryText;
    this.expiresAt = expiresAt;
    this.versionText = versionText;
    this.openRate = openRate;
    this.createdAt = createdAt;
    this.ceiling = ceiling;
    this.budgetText = budgetText;
    this.bid = bid;
    this.statusLabel = statusLabel;
  }
}

export function toGlobalPostReservationView(item: GlobalPostReservation): GlobalPostReservationView {
  return new GlobalPostReservationView(
    item.code,
    item.title,
    item.category,
    String(item.expiresAt),
    String(item.version),
    item.openRate.toFixed(2),
    String(item.createdAt),
    item.ceiling.toFixed(2),
    item.budget.toFixed(2),
    item.bid.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toGlobalPostReservationViews(items: GlobalPostReservation[]): GlobalPostReservationView[] {
  const views: GlobalPostReservationView[] = [];
  for (const item of items) {
    views.push(toGlobalPostReservationView(item));
  }
  return views;
}

export function sumGlobalPostReservationView(view: GlobalPostReservationView): number {
  const parsedExpiresAt = Number(view.expiresAt);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAt} is not a number`);
  const parsedVersion = Number(view.versionText);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.versionText} is not a number`);
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  return parsedExpiresAt + parsedVersion + parsedOpenRate;
}
