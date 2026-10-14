import * as text from "../../../../kit/text.js";
import { WeightedInviteTier } from "./weighted-invite-tier.js";

/** How screens and exports show a weighted invite tier. */
export class WeightedInviteTierView {
  code: string;
  nameText: string;
  priority: string;
  pinned: string;
  budget: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    priority: string,
    pinned: string,
    budget: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.priority = priority;
    this.pinned = pinned;
    this.budget = budget;
    this.statusLabel = statusLabel;
  }
}

export function toWeightedInviteTierView(item: WeightedInviteTier): WeightedInviteTierView {
  return new WeightedInviteTierView(
    text.truncate(item.code, 40),
    item.name,
    String(item.priority),
    `${item.pinned}`,
    item.budget.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toWeightedInviteTierViews(items: WeightedInviteTier[]): WeightedInviteTierView[] {
  const views: WeightedInviteTierView[] = [];
  for (const item of items) {
    views.push(toWeightedInviteTierView(item));
  }
  return views;
}

export function sumWeightedInviteTierView(view: WeightedInviteTierView): number {
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  return parsedPriority + parsedBudget;
}
