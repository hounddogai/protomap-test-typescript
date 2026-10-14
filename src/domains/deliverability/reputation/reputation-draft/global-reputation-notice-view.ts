import * as text from "../../../../kit/text.js";
import { GlobalReputationNotice } from "./global-reputation-notice.js";

/** How screens and exports show a global reputation notice. */
export class GlobalReputationNoticeView {
  code: string;
  title: string;
  visible: string;
  rateText: string;
  budget: string;
  priorityText: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    visible: string,
    rateText: string,
    budget: string,
    priorityText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.visible = visible;
    this.rateText = rateText;
    this.budget = budget;
    this.priorityText = priorityText;
    this.statusLabel = statusLabel;
  }
}

export function toGlobalReputationNoticeView(item: GlobalReputationNotice): GlobalReputationNoticeView {
  return new GlobalReputationNoticeView(
    text.truncate(item.code, 120),
    item.title,
    `${item.visible}`,
    item.rate.toFixed(2),
    item.budget.toFixed(2),
    String(item.priority),
    `${item.status}`.toUpperCase(),
  );
}

export function toGlobalReputationNoticeViews(items: GlobalReputationNotice[]): GlobalReputationNoticeView[] {
  const views: GlobalReputationNoticeView[] = [];
  for (const item of items) {
    views.push(toGlobalReputationNoticeView(item));
  }
  return views;
}

export function sumGlobalReputationNoticeView(view: GlobalReputationNoticeView): number {
  const parsedRate = Number(view.rateText);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rateText} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedPriority = Number(view.priorityText);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priorityText} is not a number`);
  return parsedRate + parsedBudget + parsedPriority;
}
