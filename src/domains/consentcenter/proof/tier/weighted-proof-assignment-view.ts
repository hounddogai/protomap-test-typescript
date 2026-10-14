import * as text from "../../../../kit/text.js";
import { WeightedProofAssignment } from "./weighted-proof-assignment.js";

/** How screens and exports show a weighted proof assignment. */
export class WeightedProofAssignmentView {
  code: string;
  name: string;
  expiresAt: string;
  budgetText: string;
  thresholdText: string;
  externalRefText: string;
  source: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    expiresAt: string,
    budgetText: string,
    thresholdText: string,
    externalRefText: string,
    source: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.expiresAt = expiresAt;
    this.budgetText = budgetText;
    this.thresholdText = thresholdText;
    this.externalRefText = externalRefText;
    this.source = source;
    this.statusLabel = statusLabel;
  }
}

export function toWeightedProofAssignmentView(item: WeightedProofAssignment): WeightedProofAssignmentView {
  return new WeightedProofAssignmentView(
    item.code,
    item.name,
    String(item.expiresAt),
    item.budget.toFixed(2),
    item.threshold.toFixed(2),
    text.truncate(item.externalRef, 80),
    item.source,
    `${item.status}`.toUpperCase(),
  );
}

export function toWeightedProofAssignmentViews(items: WeightedProofAssignment[]): WeightedProofAssignmentView[] {
  const views: WeightedProofAssignmentView[] = [];
  for (const item of items) {
    views.push(toWeightedProofAssignmentView(item));
  }
  return views;
}

export function sumWeightedProofAssignmentView(view: WeightedProofAssignmentView): number {
  const parsedExpiresAt = Number(view.expiresAt);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAt} is not a number`);
  const parsedBudget = Number(view.budgetText);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budgetText} is not a number`);
  const parsedThreshold = Number(view.thresholdText);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.thresholdText} is not a number`);
  return parsedExpiresAt + parsedBudget + parsedThreshold;
}
