import * as text from "../../../../kit/text.js";
import { LegacyStreakThreshold } from "./legacy-streak-threshold.js";

/** How screens and exports show a legacy streak threshold. */
export class LegacyStreakThresholdView {
  codeText: string;
  labelText: string;
  name: string;
  retries: string;
  budget: string;
  statusLabel: string;

  constructor(
    codeText: string,
    labelText: string,
    name: string,
    retries: string,
    budget: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.labelText = labelText;
    this.name = name;
    this.retries = retries;
    this.budget = budget;
    this.statusLabel = statusLabel;
  }
}

export function toLegacyStreakThresholdView(item: LegacyStreakThreshold): LegacyStreakThresholdView {
  return new LegacyStreakThresholdView(
    text.truncate(item.code, 40),
    item.label,
    item.name,
    String(item.retries),
    item.budget.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toLegacyStreakThresholdViews(items: LegacyStreakThreshold[]): LegacyStreakThresholdView[] {
  const views: LegacyStreakThresholdView[] = [];
  for (const item of items) {
    views.push(toLegacyStreakThresholdView(item));
  }
  return views;
}

export function sumLegacyStreakThresholdView(view: LegacyStreakThresholdView): number {
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  return parsedRetries + parsedBudget;
}
