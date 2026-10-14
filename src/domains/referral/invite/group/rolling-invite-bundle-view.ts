import * as text from "../../../../kit/text.js";
import { RollingInviteBundle } from "./rolling-invite-bundle.js";

/** How screens and exports show a rolling invite bundle. */
export class RollingInviteBundleView {
  code: string;
  name: string;
  unit: string;
  budgetText: string;
  reviewerText: string;
  currency: string;
  visible: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    unit: string,
    budgetText: string,
    reviewerText: string,
    currency: string,
    visible: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.unit = unit;
    this.budgetText = budgetText;
    this.reviewerText = reviewerText;
    this.currency = currency;
    this.visible = visible;
    this.statusLabel = statusLabel;
  }
}

export function toRollingInviteBundleView(item: RollingInviteBundle): RollingInviteBundleView {
  return new RollingInviteBundleView(
    item.code,
    item.name,
    item.unit,
    item.budget.toFixed(2),
    text.truncate(item.reviewer, 80),
    item.currency,
    `${item.visible}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toRollingInviteBundleViews(items: RollingInviteBundle[]): RollingInviteBundleView[] {
  const views: RollingInviteBundleView[] = [];
  for (const item of items) {
    views.push(toRollingInviteBundleView(item));
  }
  return views;
}

export function sumRollingInviteBundleView(view: RollingInviteBundleView): number {
  const parsedBudget = Number(view.budgetText);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budgetText} is not a number`);
  return parsedBudget;
}
