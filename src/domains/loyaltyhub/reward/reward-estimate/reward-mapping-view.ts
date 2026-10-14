import * as text from "../../../../kit/text.js";
import { RewardMapping } from "./reward-mapping.js";

/** How screens and exports show a reward mapping. */
export class RewardMappingView {
  code: string;
  name: string;
  budget: string;
  activeText: string;
  unit: string;
  windowDays: string;
  minimum: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    budget: string,
    activeText: string,
    unit: string,
    windowDays: string,
    minimum: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.budget = budget;
    this.activeText = activeText;
    this.unit = unit;
    this.windowDays = windowDays;
    this.minimum = minimum;
    this.statusLabel = statusLabel;
  }
}

export function toRewardMappingView(item: RewardMapping): RewardMappingView {
  return new RewardMappingView(
    item.code,
    text.truncate(item.name, 40),
    item.budget.toFixed(2),
    `${item.active}`,
    item.unit,
    String(item.windowDays),
    item.minimum.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toRewardMappingViews(items: RewardMapping[]): RewardMappingView[] {
  const views: RewardMappingView[] = [];
  for (const item of items) {
    views.push(toRewardMappingView(item));
  }
  return views;
}

export function sumRewardMappingView(view: RewardMappingView): number {
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedWindowDays = Number(view.windowDays);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDays} is not a number`);
  const parsedMinimum = Number(view.minimum);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimum} is not a number`);
  return parsedBudget + parsedWindowDays + parsedMinimum;
}
