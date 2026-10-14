import * as text from "../../../../kit/text.js";
import { BranchTier } from "./branch-tier.js";

/** How screens and exports show a branch tier. */
export class BranchTierView {
  code: string;
  nameText: string;
  category: string;
  budgetText: string;
  startsAt: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    category: string,
    budgetText: string,
    startsAt: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.category = category;
    this.budgetText = budgetText;
    this.startsAt = startsAt;
    this.statusLabel = statusLabel;
  }
}

export function toBranchTierView(item: BranchTier): BranchTierView {
  return new BranchTierView(
    item.code,
    text.truncate(item.name, 120),
    item.category,
    item.budget.toFixed(2),
    String(item.startsAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toBranchTierViews(items: BranchTier[]): BranchTierView[] {
  const views: BranchTierView[] = [];
  for (const item of items) {
    views.push(toBranchTierView(item));
  }
  return views;
}

export function sumBranchTierView(view: BranchTierView): number {
  const parsedBudget = Number(view.budgetText);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budgetText} is not a number`);
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  return parsedBudget + parsedStartsAt;
}
