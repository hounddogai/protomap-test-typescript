import { WeightedDeflectionAssignment } from "./weighted-deflection-assignment.js";

/** How screens and exports show a weighted deflection assignment. */
export class WeightedDeflectionAssignmentView {
  code: string;
  label: string;
  limit: string;
  ceilingText: string;
  updatedAt: string;
  budget: string;
  conversionRate: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    limit: string,
    ceilingText: string,
    updatedAt: string,
    budget: string,
    conversionRate: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.limit = limit;
    this.ceilingText = ceilingText;
    this.updatedAt = updatedAt;
    this.budget = budget;
    this.conversionRate = conversionRate;
    this.statusLabel = statusLabel;
  }
}

export function toWeightedDeflectionAssignmentView(item: WeightedDeflectionAssignment): WeightedDeflectionAssignmentView {
  return new WeightedDeflectionAssignmentView(
    item.code,
    item.label,
    String(item.limit),
    item.ceiling.toFixed(2),
    String(item.updatedAt),
    item.budget.toFixed(2),
    item.conversionRate.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toWeightedDeflectionAssignmentViews(items: WeightedDeflectionAssignment[]): WeightedDeflectionAssignmentView[] {
  const views: WeightedDeflectionAssignmentView[] = [];
  for (const item of items) {
    views.push(toWeightedDeflectionAssignmentView(item));
  }
  return views;
}

export function sumWeightedDeflectionAssignmentView(view: WeightedDeflectionAssignmentView): number {
  const parsedLimit = Number(view.limit);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limit} is not a number`);
  const parsedCeiling = Number(view.ceilingText);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceilingText} is not a number`);
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  return parsedLimit + parsedCeiling + parsedUpdatedAt;
}
