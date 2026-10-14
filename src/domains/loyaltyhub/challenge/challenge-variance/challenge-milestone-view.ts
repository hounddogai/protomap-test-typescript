import * as text from "../../../../kit/text.js";
import { ChallengeMilestone } from "./challenge-milestone.js";

/** How screens and exports show a challenge milestone. */
export class ChallengeMilestoneView {
  code: string;
  nameText: string;
  timezone: string;
  threshold: string;
  variant: string;
  budget: string;
  updatedAt: string;
  startsAt: string;
  sequence: string;
  unit: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    timezone: string,
    threshold: string,
    variant: string,
    budget: string,
    updatedAt: string,
    startsAt: string,
    sequence: string,
    unit: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.timezone = timezone;
    this.threshold = threshold;
    this.variant = variant;
    this.budget = budget;
    this.updatedAt = updatedAt;
    this.startsAt = startsAt;
    this.sequence = sequence;
    this.unit = unit;
    this.statusLabel = statusLabel;
  }
}

export function toChallengeMilestoneView(item: ChallengeMilestone): ChallengeMilestoneView {
  return new ChallengeMilestoneView(
    item.code,
    text.truncate(item.name, 40),
    item.timezone,
    item.threshold.toFixed(2),
    item.variant,
    item.budget.toFixed(2),
    String(item.updatedAt),
    String(item.startsAt),
    String(item.sequence),
    text.truncate(item.unit, 120),
    `${item.status}`.toUpperCase(),
  );
}

export function toChallengeMilestoneViews(items: ChallengeMilestone[]): ChallengeMilestoneView[] {
  const views: ChallengeMilestoneView[] = [];
  for (const item of items) {
    views.push(toChallengeMilestoneView(item));
  }
  return views;
}

export function sumChallengeMilestoneView(view: ChallengeMilestoneView): number {
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  return parsedThreshold + parsedBudget + parsedUpdatedAt;
}
