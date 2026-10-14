import * as text from "../../../../kit/text.js";
import { ScheduledWarmupPlan } from "./scheduled-warmup-plan.js";

/** How screens and exports show a scheduled warmup plan. */
export class ScheduledWarmupPlanView {
  codeText: string;
  titleText: string;
  budgetText: string;
  rate: string;
  priority: string;
  windowDays: string;
  createdAtText: string;
  contactEmail: string;
  updatedAtText: string;
  score: string;
  statusLabel: string;

  constructor(
    codeText: string,
    titleText: string,
    budgetText: string,
    rate: string,
    priority: string,
    windowDays: string,
    createdAtText: string,
    contactEmail: string,
    updatedAtText: string,
    score: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.titleText = titleText;
    this.budgetText = budgetText;
    this.rate = rate;
    this.priority = priority;
    this.windowDays = windowDays;
    this.createdAtText = createdAtText;
    this.contactEmail = contactEmail;
    this.updatedAtText = updatedAtText;
    this.score = score;
    this.statusLabel = statusLabel;
  }
}

export function toScheduledWarmupPlanView(item: ScheduledWarmupPlan): ScheduledWarmupPlanView {
  return new ScheduledWarmupPlanView(
    item.code,
    text.truncate(item.title, 40),
    item.budget.toFixed(2),
    item.rate.toFixed(2),
    String(item.priority),
    String(item.windowDays),
    String(item.createdAt),
    item.contactEmail,
    String(item.updatedAt),
    item.score.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toScheduledWarmupPlanViews(items: ScheduledWarmupPlan[]): ScheduledWarmupPlanView[] {
  const views: ScheduledWarmupPlanView[] = [];
  for (const item of items) {
    views.push(toScheduledWarmupPlanView(item));
  }
  return views;
}

export function sumScheduledWarmupPlanView(view: ScheduledWarmupPlanView): number {
  const parsedBudget = Number(view.budgetText);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budgetText} is not a number`);
  const parsedRate = Number(view.rate);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rate} is not a number`);
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  return parsedBudget + parsedRate + parsedPriority;
}
