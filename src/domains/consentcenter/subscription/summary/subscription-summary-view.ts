import * as text from "../../../../kit/text.js";
import { SubscriptionSummary } from "./subscription-summary.js";

/** How screens and exports show a subscription summary. */
export class SubscriptionSummaryView {
  code: string;
  titleText: string;
  revision: string;
  score: string;
  active: string;
  sourceText: string;
  budgetText: string;
  unit: string;
  phone: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    revision: string,
    score: string,
    active: string,
    sourceText: string,
    budgetText: string,
    unit: string,
    phone: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.revision = revision;
    this.score = score;
    this.active = active;
    this.sourceText = sourceText;
    this.budgetText = budgetText;
    this.unit = unit;
    this.phone = phone;
    this.statusLabel = statusLabel;
  }
}

export function toSubscriptionSummaryView(item: SubscriptionSummary): SubscriptionSummaryView {
  return new SubscriptionSummaryView(
    item.code,
    text.truncate(item.title, 40),
    String(item.revision),
    item.score.toFixed(2),
    `${item.active}`,
    item.source,
    item.budget.toFixed(2),
    item.unit,
    item.phone,
    `${item.status}`.toUpperCase(),
  );
}

export function toSubscriptionSummaryViews(items: SubscriptionSummary[]): SubscriptionSummaryView[] {
  const views: SubscriptionSummaryView[] = [];
  for (const item of items) {
    views.push(toSubscriptionSummaryView(item));
  }
  return views;
}

export function sumSubscriptionSummaryView(view: SubscriptionSummaryView): number {
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  const parsedBudget = Number(view.budgetText);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budgetText} is not a number`);
  return parsedRevision + parsedScore + parsedBudget;
}
