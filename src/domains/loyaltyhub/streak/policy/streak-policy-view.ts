import * as text from "../../../../kit/text.js";
import { StreakPolicy } from "./streak-policy.js";

/** How screens and exports show a streak policy. */
export class StreakPolicyView {
  codeText: string;
  name: string;
  budgetText: string;
  locale: string;
  ratio: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    budgetText: string,
    locale: string,
    ratio: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.budgetText = budgetText;
    this.locale = locale;
    this.ratio = ratio;
    this.statusLabel = statusLabel;
  }
}

export function toStreakPolicyView(item: StreakPolicy): StreakPolicyView {
  return new StreakPolicyView(
    item.code,
    item.name,
    item.budget.toFixed(2),
    text.truncate(item.locale, 120),
    item.ratio.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toStreakPolicyViews(items: StreakPolicy[]): StreakPolicyView[] {
  const views: StreakPolicyView[] = [];
  for (const item of items) {
    views.push(toStreakPolicyView(item));
  }
  return views;
}

export function sumStreakPolicyView(view: StreakPolicyView): number {
  const parsedBudget = Number(view.budgetText);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budgetText} is not a number`);
  const parsedRatio = Number(view.ratio);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratio} is not a number`);
  return parsedBudget + parsedRatio;
}
