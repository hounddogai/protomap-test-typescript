import * as text from "../../../../kit/text.js";
import { ManualLevelPlan } from "./manual-level-plan.js";

/** How screens and exports show a manual level plan. */
export class ManualLevelPlanView {
  code: string;
  label: string;
  unit: string;
  attempts: string;
  notes: string;
  priority: string;
  openRateText: string;
  category: string;
  region: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    unit: string,
    attempts: string,
    notes: string,
    priority: string,
    openRateText: string,
    category: string,
    region: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.unit = unit;
    this.attempts = attempts;
    this.notes = notes;
    this.priority = priority;
    this.openRateText = openRateText;
    this.category = category;
    this.region = region;
    this.statusLabel = statusLabel;
  }
}

export function toManualLevelPlanView(item: ManualLevelPlan): ManualLevelPlanView {
  return new ManualLevelPlanView(
    item.code,
    item.label,
    item.unit,
    String(item.attempts),
    item.notes,
    String(item.priority),
    item.openRate.toFixed(2),
    text.truncate(item.category, 40),
    item.region,
    `${item.status}`.toUpperCase(),
  );
}

export function toManualLevelPlanViews(items: ManualLevelPlan[]): ManualLevelPlanView[] {
  const views: ManualLevelPlanView[] = [];
  for (const item of items) {
    views.push(toManualLevelPlanView(item));
  }
  return views;
}

export function sumManualLevelPlanView(view: ManualLevelPlanView): number {
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  const parsedOpenRate = Number(view.openRateText);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRateText} is not a number`);
  return parsedAttempts + parsedPriority + parsedOpenRate;
}
