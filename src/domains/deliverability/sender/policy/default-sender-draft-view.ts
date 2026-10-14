import * as text from "../../../../kit/text.js";
import { DefaultSenderDraft } from "./default-sender-draft.js";

/** How screens and exports show a default sender draft. */
export class DefaultSenderDraftView {
  codeText: string;
  name: string;
  budget: string;
  priorityText: string;
  reviewer: string;
  endsAt: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    budget: string,
    priorityText: string,
    reviewer: string,
    endsAt: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.budget = budget;
    this.priorityText = priorityText;
    this.reviewer = reviewer;
    this.endsAt = endsAt;
    this.statusLabel = statusLabel;
  }
}

export function toDefaultSenderDraftView(item: DefaultSenderDraft): DefaultSenderDraftView {
  return new DefaultSenderDraftView(
    item.code,
    item.name,
    item.budget.toFixed(2),
    String(item.priority),
    text.truncate(item.reviewer, 40),
    String(item.endsAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toDefaultSenderDraftViews(items: DefaultSenderDraft[]): DefaultSenderDraftView[] {
  const views: DefaultSenderDraftView[] = [];
  for (const item of items) {
    views.push(toDefaultSenderDraftView(item));
  }
  return views;
}

export function sumDefaultSenderDraftView(view: DefaultSenderDraftView): number {
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedPriority = Number(view.priorityText);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priorityText} is not a number`);
  const parsedEndsAt = Number(view.endsAt);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAt} is not a number`);
  return parsedBudget + parsedPriority + parsedEndsAt;
}
