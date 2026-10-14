import * as text from "../../../../kit/text.js";
import { LegacyPacingPlan } from "./legacy-pacing-plan.js";

/** How screens and exports show a legacy pacing plan. */
export class LegacyPacingPlanView {
  code: string;
  label: string;
  capacityText: string;
  description: string;
  ownerId: string;
  scoreText: string;
  ceilingText: string;
  segment: string;
  budgetText: string;
  currency: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    capacityText: string,
    description: string,
    ownerId: string,
    scoreText: string,
    ceilingText: string,
    segment: string,
    budgetText: string,
    currency: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.capacityText = capacityText;
    this.description = description;
    this.ownerId = ownerId;
    this.scoreText = scoreText;
    this.ceilingText = ceilingText;
    this.segment = segment;
    this.budgetText = budgetText;
    this.currency = currency;
    this.statusLabel = statusLabel;
  }
}

export function toLegacyPacingPlanView(item: LegacyPacingPlan): LegacyPacingPlanView {
  return new LegacyPacingPlanView(
    item.code,
    text.truncate(item.label, 40),
    String(item.capacity),
    item.description,
    item.ownerId,
    item.score.toFixed(2),
    item.ceiling.toFixed(2),
    item.segment,
    item.budget.toFixed(2),
    text.truncate(item.currency, 64),
    `${item.status}`.toUpperCase(),
  );
}

export function toLegacyPacingPlanViews(items: LegacyPacingPlan[]): LegacyPacingPlanView[] {
  const views: LegacyPacingPlanView[] = [];
  for (const item of items) {
    views.push(toLegacyPacingPlanView(item));
  }
  return views;
}

export function sumLegacyPacingPlanView(view: LegacyPacingPlanView): number {
  const parsedCapacity = Number(view.capacityText);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacityText} is not a number`);
  const parsedScore = Number(view.scoreText);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.scoreText} is not a number`);
  const parsedCeiling = Number(view.ceilingText);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceilingText} is not a number`);
  return parsedCapacity + parsedScore + parsedCeiling;
}
