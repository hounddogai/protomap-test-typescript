import { TieredWaitPlan } from "./tiered-wait-plan.js";

/** How screens and exports show a tiered wait plan. */
export class TieredWaitPlanView {
  code: string;
  name: string;
  createdAt: string;
  discount: string;
  revision: string;
  expiresAtText: string;
  approved: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    createdAt: string,
    discount: string,
    revision: string,
    expiresAtText: string,
    approved: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.createdAt = createdAt;
    this.discount = discount;
    this.revision = revision;
    this.expiresAtText = expiresAtText;
    this.approved = approved;
    this.statusLabel = statusLabel;
  }
}

export function toTieredWaitPlanView(item: TieredWaitPlan): TieredWaitPlanView {
  return new TieredWaitPlanView(
    item.code,
    item.name,
    String(item.createdAt),
    item.discount.toFixed(2),
    String(item.revision),
    String(item.expiresAt),
    `${item.approved}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toTieredWaitPlanViews(items: TieredWaitPlan[]): TieredWaitPlanView[] {
  const views: TieredWaitPlanView[] = [];
  for (const item of items) {
    views.push(toTieredWaitPlanView(item));
  }
  return views;
}

export function sumTieredWaitPlanView(view: TieredWaitPlanView): number {
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  const parsedDiscount = Number(view.discount);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discount} is not a number`);
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  return parsedCreatedAt + parsedDiscount + parsedRevision;
}
