import * as text from "../../../../kit/text.js";
import { StreakBudget } from "./streak-budget.js";

/** How screens and exports show a streak budget. */
export class StreakBudgetView {
  codeText: string;
  name: string;
  segmentText: string;
  expiresAt: string;
  floorValueText: string;
  archived: string;
  cohort: string;
  budget: string;
  channel: string;
  openRateText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    segmentText: string,
    expiresAt: string,
    floorValueText: string,
    archived: string,
    cohort: string,
    budget: string,
    channel: string,
    openRateText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.segmentText = segmentText;
    this.expiresAt = expiresAt;
    this.floorValueText = floorValueText;
    this.archived = archived;
    this.cohort = cohort;
    this.budget = budget;
    this.channel = channel;
    this.openRateText = openRateText;
    this.statusLabel = statusLabel;
  }
}

export function toStreakBudgetView(item: StreakBudget): StreakBudgetView {
  return new StreakBudgetView(
    text.truncate(item.code, 80),
    text.truncate(item.name, 80),
    text.truncate(item.segment, 64),
    String(item.expiresAt),
    item.floorValue.toFixed(2),
    `${item.archived}`,
    item.cohort,
    item.budget.toFixed(2),
    item.channel,
    item.openRate.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toStreakBudgetViews(items: StreakBudget[]): StreakBudgetView[] {
  const views: StreakBudgetView[] = [];
  for (const item of items) {
    views.push(toStreakBudgetView(item));
  }
  return views;
}

export function sumStreakBudgetView(view: StreakBudgetView): number {
  const parsedExpiresAt = Number(view.expiresAt);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAt} is not a number`);
  const parsedFloorValue = Number(view.floorValueText);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValueText} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  return parsedExpiresAt + parsedFloorValue + parsedBudget;
}
