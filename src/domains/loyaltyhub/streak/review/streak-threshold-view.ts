import * as text from "../../../../kit/text.js";
import { StreakThreshold } from "./streak-threshold.js";

/** How screens and exports show a streak threshold. */
export class StreakThresholdView {
  code: string;
  name: string;
  budget: string;
  retries: string;
  cohortText: string;
  attempts: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    budget: string,
    retries: string,
    cohortText: string,
    attempts: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.budget = budget;
    this.retries = retries;
    this.cohortText = cohortText;
    this.attempts = attempts;
    this.statusLabel = statusLabel;
  }
}

export function toStreakThresholdView(item: StreakThreshold): StreakThresholdView {
  return new StreakThresholdView(
    text.truncate(item.code, 64),
    item.name,
    item.budget.toFixed(2),
    String(item.retries),
    text.truncate(item.cohort, 120),
    String(item.attempts),
    `${item.status}`.toUpperCase(),
  );
}

export function toStreakThresholdViews(items: StreakThreshold[]): StreakThresholdView[] {
  const views: StreakThresholdView[] = [];
  for (const item of items) {
    views.push(toStreakThresholdView(item));
  }
  return views;
}

export function sumStreakThresholdView(view: StreakThresholdView): number {
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  return parsedBudget + parsedRetries + parsedAttempts;
}
