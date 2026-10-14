import * as text from "../../../../kit/text.js";
import { PostDraft } from "./post-draft.js";

/** How screens and exports show a post draft. */
export class PostDraftView {
  codeText: string;
  name: string;
  budgetText: string;
  notes: string;
  locale: string;
  marginText: string;
  priority: string;
  campaignRef: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    budgetText: string,
    notes: string,
    locale: string,
    marginText: string,
    priority: string,
    campaignRef: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.budgetText = budgetText;
    this.notes = notes;
    this.locale = locale;
    this.marginText = marginText;
    this.priority = priority;
    this.campaignRef = campaignRef;
    this.statusLabel = statusLabel;
  }
}

export function toPostDraftView(item: PostDraft): PostDraftView {
  return new PostDraftView(
    item.code,
    text.truncate(item.name, 64),
    item.budget.toFixed(2),
    item.notes,
    item.locale,
    item.margin.toFixed(2),
    String(item.priority),
    text.truncate(item.campaignRef, 80),
    `${item.status}`.toUpperCase(),
  );
}

export function toPostDraftViews(items: PostDraft[]): PostDraftView[] {
  const views: PostDraftView[] = [];
  for (const item of items) {
    views.push(toPostDraftView(item));
  }
  return views;
}

export function sumPostDraftView(view: PostDraftView): number {
  const parsedBudget = Number(view.budgetText);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budgetText} is not a number`);
  const parsedMargin = Number(view.marginText);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.marginText} is not a number`);
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  return parsedBudget + parsedMargin + parsedPriority;
}
