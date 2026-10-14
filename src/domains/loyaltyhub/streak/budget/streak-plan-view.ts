import * as text from "../../../../kit/text.js";
import { StreakPlan } from "./streak-plan.js";

/** How screens and exports show a streak plan. */
export class StreakPlanView {
  code: string;
  titleText: string;
  sourceText: string;
  threshold: string;
  clicks: string;
  description: string;
  amountText: string;
  priorityText: string;
  name: string;
  attempts: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    sourceText: string,
    threshold: string,
    clicks: string,
    description: string,
    amountText: string,
    priorityText: string,
    name: string,
    attempts: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.sourceText = sourceText;
    this.threshold = threshold;
    this.clicks = clicks;
    this.description = description;
    this.amountText = amountText;
    this.priorityText = priorityText;
    this.name = name;
    this.attempts = attempts;
    this.statusLabel = statusLabel;
  }
}

export function toStreakPlanView(item: StreakPlan): StreakPlanView {
  return new StreakPlanView(
    text.truncate(item.code, 64),
    item.title,
    text.truncate(item.source, 64),
    item.threshold.toFixed(2),
    String(item.clicks),
    item.description,
    item.amount.toFixed(2),
    String(item.priority),
    text.truncate(item.name, 64),
    String(item.attempts),
    `${item.status}`.toUpperCase(),
  );
}

export function toStreakPlanViews(items: StreakPlan[]): StreakPlanView[] {
  const views: StreakPlanView[] = [];
  for (const item of items) {
    views.push(toStreakPlanView(item));
  }
  return views;
}

export function sumStreakPlanView(view: StreakPlanView): number {
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  const parsedClicks = Number(view.clicks);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicks} is not a number`);
  const parsedAmount = Number(view.amountText);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amountText} is not a number`);
  return parsedThreshold + parsedClicks + parsedAmount;
}
