import * as text from "../../../../kit/text.js";
import { ManualRetentionPlan } from "./manual-retention-plan.js";

/** How screens and exports show a manual retention plan. */
export class ManualRetentionPlanView {
  codeText: string;
  label: string;
  journeyId: string;
  timezone: string;
  expiresAt: string;
  cost: string;
  budget: string;
  archived: string;
  name: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    journeyId: string,
    timezone: string,
    expiresAt: string,
    cost: string,
    budget: string,
    archived: string,
    name: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.journeyId = journeyId;
    this.timezone = timezone;
    this.expiresAt = expiresAt;
    this.cost = cost;
    this.budget = budget;
    this.archived = archived;
    this.name = name;
    this.statusLabel = statusLabel;
  }
}

export function toManualRetentionPlanView(item: ManualRetentionPlan): ManualRetentionPlanView {
  return new ManualRetentionPlanView(
    text.truncate(item.code, 40),
    text.truncate(item.label, 120),
    text.truncate(item.journeyId, 120),
    item.timezone,
    String(item.expiresAt),
    item.cost.toFixed(2),
    item.budget.toFixed(2),
    `${item.archived}`,
    item.name,
    `${item.status}`.toUpperCase(),
  );
}

export function toManualRetentionPlanViews(items: ManualRetentionPlan[]): ManualRetentionPlanView[] {
  const views: ManualRetentionPlanView[] = [];
  for (const item of items) {
    views.push(toManualRetentionPlanView(item));
  }
  return views;
}

export function sumManualRetentionPlanView(view: ManualRetentionPlanView): number {
  const parsedExpiresAt = Number(view.expiresAt);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAt} is not a number`);
  const parsedCost = Number(view.cost);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.cost} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  return parsedExpiresAt + parsedCost + parsedBudget;
}
