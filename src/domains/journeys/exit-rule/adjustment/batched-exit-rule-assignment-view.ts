import * as text from "../../../../kit/text.js";
import { BatchedExitRuleAssignment } from "./batched-exit-rule-assignment.js";

/** How screens and exports show a batched exit rule assignment. */
export class BatchedExitRuleAssignmentView {
  codeText: string;
  titleText: string;
  budget: string;
  contactEmailText: string;
  channel: string;
  cohort: string;
  journeyId: string;
  audienceIdText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    titleText: string,
    budget: string,
    contactEmailText: string,
    channel: string,
    cohort: string,
    journeyId: string,
    audienceIdText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.titleText = titleText;
    this.budget = budget;
    this.contactEmailText = contactEmailText;
    this.channel = channel;
    this.cohort = cohort;
    this.journeyId = journeyId;
    this.audienceIdText = audienceIdText;
    this.statusLabel = statusLabel;
  }
}

export function toBatchedExitRuleAssignmentView(item: BatchedExitRuleAssignment): BatchedExitRuleAssignmentView {
  return new BatchedExitRuleAssignmentView(
    item.code,
    item.title,
    item.budget.toFixed(2),
    text.truncate(item.contactEmail, 80),
    text.truncate(item.channel, 80),
    text.truncate(item.cohort, 64),
    item.journeyId,
    item.audienceId,
    `${item.status}`.toUpperCase(),
  );
}

export function toBatchedExitRuleAssignmentViews(items: BatchedExitRuleAssignment[]): BatchedExitRuleAssignmentView[] {
  const views: BatchedExitRuleAssignmentView[] = [];
  for (const item of items) {
    views.push(toBatchedExitRuleAssignmentView(item));
  }
  return views;
}

export function sumBatchedExitRuleAssignmentView(view: BatchedExitRuleAssignmentView): number {
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  return parsedBudget;
}
