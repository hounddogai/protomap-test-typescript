import * as text from "../../../../kit/text.js";
import { StrictInviteMetric } from "./strict-invite-metric.js";

/** How screens and exports show a strict invite metric. */
export class StrictInviteMetricView {
  code: string;
  name: string;
  budgetText: string;
  notesText: string;
  contactEmailText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    budgetText: string,
    notesText: string,
    contactEmailText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.budgetText = budgetText;
    this.notesText = notesText;
    this.contactEmailText = contactEmailText;
    this.statusLabel = statusLabel;
  }
}

export function toStrictInviteMetricView(item: StrictInviteMetric): StrictInviteMetricView {
  return new StrictInviteMetricView(
    text.truncate(item.code, 40),
    item.name,
    item.budget.toFixed(2),
    item.notes,
    item.contactEmail,
    `${item.status}`.toUpperCase(),
  );
}

export function toStrictInviteMetricViews(items: StrictInviteMetric[]): StrictInviteMetricView[] {
  const views: StrictInviteMetricView[] = [];
  for (const item of items) {
    views.push(toStrictInviteMetricView(item));
  }
  return views;
}

export function sumStrictInviteMetricView(view: StrictInviteMetricView): number {
  const parsedBudget = Number(view.budgetText);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budgetText} is not a number`);
  return parsedBudget;
}
