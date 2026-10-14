import * as text from "../../../../kit/text.js";
import { PacingTier } from "./pacing-tier.js";

/** How screens and exports show a pacing tier. */
export class PacingTierView {
  code: string;
  labelText: string;
  timezoneText: string;
  budget: string;
  approvedText: string;
  discount: string;
  updatedAt: string;
  name: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    timezoneText: string,
    budget: string,
    approvedText: string,
    discount: string,
    updatedAt: string,
    name: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.timezoneText = timezoneText;
    this.budget = budget;
    this.approvedText = approvedText;
    this.discount = discount;
    this.updatedAt = updatedAt;
    this.name = name;
    this.statusLabel = statusLabel;
  }
}

export function toPacingTierView(item: PacingTier): PacingTierView {
  return new PacingTierView(
    item.code,
    text.truncate(item.label, 80),
    item.timezone,
    item.budget.toFixed(2),
    `${item.approved}`,
    item.discount.toFixed(2),
    String(item.updatedAt),
    item.name,
    `${item.status}`.toUpperCase(),
  );
}

export function toPacingTierViews(items: PacingTier[]): PacingTierView[] {
  const views: PacingTierView[] = [];
  for (const item of items) {
    views.push(toPacingTierView(item));
  }
  return views;
}

export function sumPacingTierView(view: PacingTierView): number {
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedDiscount = Number(view.discount);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discount} is not a number`);
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  return parsedBudget + parsedDiscount + parsedUpdatedAt;
}
