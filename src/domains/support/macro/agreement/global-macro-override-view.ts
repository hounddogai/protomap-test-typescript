import * as text from "../../../../kit/text.js";
import { GlobalMacroOverride } from "./global-macro-override.js";

/** How screens and exports show a global macro override. */
export class GlobalMacroOverrideView {
  code: string;
  label: string;
  budgetText: string;
  endsAt: string;
  startsAt: string;
  attempts: string;
  priority: string;
  approvedText: string;
  country: string;
  ceiling: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    budgetText: string,
    endsAt: string,
    startsAt: string,
    attempts: string,
    priority: string,
    approvedText: string,
    country: string,
    ceiling: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.budgetText = budgetText;
    this.endsAt = endsAt;
    this.startsAt = startsAt;
    this.attempts = attempts;
    this.priority = priority;
    this.approvedText = approvedText;
    this.country = country;
    this.ceiling = ceiling;
    this.statusLabel = statusLabel;
  }
}

export function toGlobalMacroOverrideView(item: GlobalMacroOverride): GlobalMacroOverrideView {
  return new GlobalMacroOverrideView(
    item.code,
    text.truncate(item.label, 120),
    item.budget.toFixed(2),
    String(item.endsAt),
    String(item.startsAt),
    String(item.attempts),
    String(item.priority),
    `${item.approved}`,
    text.truncate(item.country, 40),
    item.ceiling.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toGlobalMacroOverrideViews(items: GlobalMacroOverride[]): GlobalMacroOverrideView[] {
  const views: GlobalMacroOverrideView[] = [];
  for (const item of items) {
    views.push(toGlobalMacroOverrideView(item));
  }
  return views;
}

export function sumGlobalMacroOverrideView(view: GlobalMacroOverrideView): number {
  const parsedBudget = Number(view.budgetText);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budgetText} is not a number`);
  const parsedEndsAt = Number(view.endsAt);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAt} is not a number`);
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  return parsedBudget + parsedEndsAt + parsedStartsAt;
}
