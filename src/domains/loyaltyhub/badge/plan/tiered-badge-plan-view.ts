import * as text from "../../../../kit/text.js";
import { TieredBadgePlan } from "./tiered-badge-plan.js";

/** How screens and exports show a tiered badge plan. */
export class TieredBadgePlanView {
  codeText: string;
  name: string;
  costText: string;
  cohort: string;
  priority: string;
  attempts: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    costText: string,
    cohort: string,
    priority: string,
    attempts: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.costText = costText;
    this.cohort = cohort;
    this.priority = priority;
    this.attempts = attempts;
    this.statusLabel = statusLabel;
  }
}

export function toTieredBadgePlanView(item: TieredBadgePlan): TieredBadgePlanView {
  return new TieredBadgePlanView(
    text.truncate(item.code, 40),
    item.name,
    item.cost.toFixed(2),
    text.truncate(item.cohort, 120),
    String(item.priority),
    String(item.attempts),
    `${item.status}`.toUpperCase(),
  );
}

export function toTieredBadgePlanViews(items: TieredBadgePlan[]): TieredBadgePlanView[] {
  const views: TieredBadgePlanView[] = [];
  for (const item of items) {
    views.push(toTieredBadgePlanView(item));
  }
  return views;
}

export function sumTieredBadgePlanView(view: TieredBadgePlanView): number {
  const parsedCost = Number(view.costText);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.costText} is not a number`);
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  return parsedCost + parsedPriority + parsedAttempts;
}
