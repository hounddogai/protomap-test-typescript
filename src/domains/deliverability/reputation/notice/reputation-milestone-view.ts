import * as text from "../../../../kit/text.js";
import { ReputationMilestone } from "./reputation-milestone.js";

/** How screens and exports show a reputation milestone. */
export class ReputationMilestoneView {
  code: string;
  name: string;
  weight: string;
  audienceId: string;
  journeyId: string;
  timezone: string;
  costText: string;
  ownerId: string;
  utmSourceText: string;
  budget: string;
  ceiling: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    weight: string,
    audienceId: string,
    journeyId: string,
    timezone: string,
    costText: string,
    ownerId: string,
    utmSourceText: string,
    budget: string,
    ceiling: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.weight = weight;
    this.audienceId = audienceId;
    this.journeyId = journeyId;
    this.timezone = timezone;
    this.costText = costText;
    this.ownerId = ownerId;
    this.utmSourceText = utmSourceText;
    this.budget = budget;
    this.ceiling = ceiling;
    this.statusLabel = statusLabel;
  }
}

export function toReputationMilestoneView(item: ReputationMilestone): ReputationMilestoneView {
  return new ReputationMilestoneView(
    item.code,
    item.name,
    item.weight.toFixed(2),
    text.truncate(item.audienceId, 80),
    item.journeyId,
    item.timezone,
    item.cost.toFixed(2),
    text.truncate(item.ownerId, 40),
    item.utmSource,
    item.budget.toFixed(2),
    item.ceiling.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toReputationMilestoneViews(items: ReputationMilestone[]): ReputationMilestoneView[] {
  const views: ReputationMilestoneView[] = [];
  for (const item of items) {
    views.push(toReputationMilestoneView(item));
  }
  return views;
}

export function sumReputationMilestoneView(view: ReputationMilestoneView): number {
  const parsedWeight = Number(view.weight);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weight} is not a number`);
  const parsedCost = Number(view.costText);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.costText} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  return parsedWeight + parsedCost + parsedBudget;
}
