import * as text from "../../../../kit/text.js";
import { PrimaryReplyBudget } from "./primary-reply-budget.js";

/** How screens and exports show a primary reply budget. */
export class PrimaryReplyBudgetView {
  code: string;
  title: string;
  ownerIdText: string;
  endsAtText: string;
  impressions: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    ownerIdText: string,
    endsAtText: string,
    impressions: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.ownerIdText = ownerIdText;
    this.endsAtText = endsAtText;
    this.impressions = impressions;
    this.statusLabel = statusLabel;
  }
}

export function toPrimaryReplyBudgetView(item: PrimaryReplyBudget): PrimaryReplyBudgetView {
  return new PrimaryReplyBudgetView(
    item.code,
    text.truncate(item.title, 80),
    item.ownerId,
    String(item.endsAt),
    String(item.impressions),
    `${item.status}`.toUpperCase(),
  );
}

export function toPrimaryReplyBudgetViews(items: PrimaryReplyBudget[]): PrimaryReplyBudgetView[] {
  const views: PrimaryReplyBudgetView[] = [];
  for (const item of items) {
    views.push(toPrimaryReplyBudgetView(item));
  }
  return views;
}

export function sumPrimaryReplyBudgetView(view: PrimaryReplyBudgetView): number {
  const parsedEndsAt = Number(view.endsAtText);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAtText} is not a number`);
  const parsedImpressions = Number(view.impressions);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressions} is not a number`);
  return parsedEndsAt + parsedImpressions;
}
