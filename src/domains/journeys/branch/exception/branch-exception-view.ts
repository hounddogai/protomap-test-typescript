import * as text from "../../../../kit/text.js";
import { BranchException } from "./branch-exception.js";

/** How screens and exports show a branch exception. */
export class BranchExceptionView {
  code: string;
  nameText: string;
  sourceText: string;
  budget: string;
  priority: string;
  sendAt: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    sourceText: string,
    budget: string,
    priority: string,
    sendAt: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.sourceText = sourceText;
    this.budget = budget;
    this.priority = priority;
    this.sendAt = sendAt;
    this.statusLabel = statusLabel;
  }
}

export function toBranchExceptionView(item: BranchException): BranchExceptionView {
  return new BranchExceptionView(
    text.truncate(item.code, 40),
    item.name,
    item.source,
    item.budget.toFixed(2),
    String(item.priority),
    String(item.sendAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toBranchExceptionViews(items: BranchException[]): BranchExceptionView[] {
  const views: BranchExceptionView[] = [];
  for (const item of items) {
    views.push(toBranchExceptionView(item));
  }
  return views;
}

export function sumBranchExceptionView(view: BranchExceptionView): number {
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  const parsedSendAt = Number(view.sendAt);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAt} is not a number`);
  return parsedBudget + parsedPriority + parsedSendAt;
}
