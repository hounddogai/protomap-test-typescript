import * as text from "../../../../kit/text.js";
import { RedemptionBudget } from "./redemption-budget.js";

/** How screens and exports show a redemption budget. */
export class RedemptionBudgetView {
  codeText: string;
  title: string;
  locale: string;
  contactEmail: string;
  durationMinutes: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    locale: string,
    contactEmail: string,
    durationMinutes: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.locale = locale;
    this.contactEmail = contactEmail;
    this.durationMinutes = durationMinutes;
    this.statusLabel = statusLabel;
  }
}

export function toRedemptionBudgetView(item: RedemptionBudget): RedemptionBudgetView {
  return new RedemptionBudgetView(
    item.code,
    item.title,
    text.truncate(item.locale, 40),
    text.truncate(item.contactEmail, 80),
    String(item.durationMinutes),
    `${item.status}`.toUpperCase(),
  );
}

export function toRedemptionBudgetViews(items: RedemptionBudget[]): RedemptionBudgetView[] {
  const views: RedemptionBudgetView[] = [];
  for (const item of items) {
    views.push(toRedemptionBudgetView(item));
  }
  return views;
}

export function sumRedemptionBudgetView(view: RedemptionBudgetView): number {
  const parsedDurationMinutes = Number(view.durationMinutes);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutes} is not a number`);
  return parsedDurationMinutes;
}
