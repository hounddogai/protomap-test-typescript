import * as text from "../../../../kit/text.js";
import { BatchedDoubleOptInPlan } from "./batched-double-opt-in-plan.js";

/** How screens and exports show a batched double opt in plan. */
export class BatchedDoubleOptInPlanView {
  codeText: string;
  nameText: string;
  score: string;
  versionText: string;
  frequencyCapText: string;
  segment: string;
  conversionRate: string;
  budget: string;
  cost: string;
  statusLabel: string;

  constructor(
    codeText: string,
    nameText: string,
    score: string,
    versionText: string,
    frequencyCapText: string,
    segment: string,
    conversionRate: string,
    budget: string,
    cost: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.nameText = nameText;
    this.score = score;
    this.versionText = versionText;
    this.frequencyCapText = frequencyCapText;
    this.segment = segment;
    this.conversionRate = conversionRate;
    this.budget = budget;
    this.cost = cost;
    this.statusLabel = statusLabel;
  }
}

export function toBatchedDoubleOptInPlanView(item: BatchedDoubleOptInPlan): BatchedDoubleOptInPlanView {
  return new BatchedDoubleOptInPlanView(
    text.truncate(item.code, 40),
    item.name,
    item.score.toFixed(2),
    String(item.version),
    String(item.frequencyCap),
    item.segment,
    item.conversionRate.toFixed(2),
    item.budget.toFixed(2),
    item.cost.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toBatchedDoubleOptInPlanViews(items: BatchedDoubleOptInPlan[]): BatchedDoubleOptInPlanView[] {
  const views: BatchedDoubleOptInPlanView[] = [];
  for (const item of items) {
    views.push(toBatchedDoubleOptInPlanView(item));
  }
  return views;
}

export function sumBatchedDoubleOptInPlanView(view: BatchedDoubleOptInPlanView): number {
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  const parsedVersion = Number(view.versionText);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.versionText} is not a number`);
  const parsedFrequencyCap = Number(view.frequencyCapText);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCapText} is not a number`);
  return parsedScore + parsedVersion + parsedFrequencyCap;
}
