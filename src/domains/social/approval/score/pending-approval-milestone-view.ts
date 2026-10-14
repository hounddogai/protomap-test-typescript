import * as text from "../../../../kit/text.js";
import { PendingApprovalMilestone } from "./pending-approval-milestone.js";

/** How screens and exports show a pending approval milestone. */
export class PendingApprovalMilestoneView {
  code: string;
  title: string;
  durationMinutes: string;
  journeyId: string;
  updatedAt: string;
  utmSource: string;
  budget: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    durationMinutes: string,
    journeyId: string,
    updatedAt: string,
    utmSource: string,
    budget: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.durationMinutes = durationMinutes;
    this.journeyId = journeyId;
    this.updatedAt = updatedAt;
    this.utmSource = utmSource;
    this.budget = budget;
    this.statusLabel = statusLabel;
  }
}

export function toPendingApprovalMilestoneView(item: PendingApprovalMilestone): PendingApprovalMilestoneView {
  return new PendingApprovalMilestoneView(
    text.truncate(item.code, 80),
    item.title,
    String(item.durationMinutes),
    text.truncate(item.journeyId, 40),
    String(item.updatedAt),
    item.utmSource,
    item.budget.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toPendingApprovalMilestoneViews(items: PendingApprovalMilestone[]): PendingApprovalMilestoneView[] {
  const views: PendingApprovalMilestoneView[] = [];
  for (const item of items) {
    views.push(toPendingApprovalMilestoneView(item));
  }
  return views;
}

export function sumPendingApprovalMilestoneView(view: PendingApprovalMilestoneView): number {
  const parsedDurationMinutes = Number(view.durationMinutes);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutes} is not a number`);
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  return parsedDurationMinutes + parsedUpdatedAt + parsedBudget;
}
