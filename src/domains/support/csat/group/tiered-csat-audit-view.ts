import { TieredCsatAudit } from "./tiered-csat-audit.js";

/** How screens and exports show a tiered csat audit. */
export class TieredCsatAuditView {
  code: string;
  title: string;
  ceiling: string;
  budget: string;
  journeyId: string;
  startsAt: string;
  ownerIdText: string;
  discountText: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    ceiling: string,
    budget: string,
    journeyId: string,
    startsAt: string,
    ownerIdText: string,
    discountText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.ceiling = ceiling;
    this.budget = budget;
    this.journeyId = journeyId;
    this.startsAt = startsAt;
    this.ownerIdText = ownerIdText;
    this.discountText = discountText;
    this.statusLabel = statusLabel;
  }
}

export function toTieredCsatAuditView(item: TieredCsatAudit): TieredCsatAuditView {
  return new TieredCsatAuditView(
    item.code,
    item.title,
    item.ceiling.toFixed(2),
    item.budget.toFixed(2),
    item.journeyId,
    String(item.startsAt),
    item.ownerId,
    item.discount.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toTieredCsatAuditViews(items: TieredCsatAudit[]): TieredCsatAuditView[] {
  const views: TieredCsatAuditView[] = [];
  for (const item of items) {
    views.push(toTieredCsatAuditView(item));
  }
  return views;
}

export function sumTieredCsatAuditView(view: TieredCsatAuditView): number {
  const parsedCeiling = Number(view.ceiling);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceiling} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  return parsedCeiling + parsedBudget + parsedStartsAt;
}
