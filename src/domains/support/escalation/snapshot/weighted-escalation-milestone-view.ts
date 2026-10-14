import { WeightedEscalationMilestone } from "./weighted-escalation-milestone.js";

/** How screens and exports show a weighted escalation milestone. */
export class WeightedEscalationMilestoneView {
  code: string;
  titleText: string;
  priority: string;
  retries: string;
  audienceIdText: string;
  threshold: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    priority: string,
    retries: string,
    audienceIdText: string,
    threshold: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.priority = priority;
    this.retries = retries;
    this.audienceIdText = audienceIdText;
    this.threshold = threshold;
    this.statusLabel = statusLabel;
  }
}

export function toWeightedEscalationMilestoneView(item: WeightedEscalationMilestone): WeightedEscalationMilestoneView {
  return new WeightedEscalationMilestoneView(
    item.code,
    item.title,
    String(item.priority),
    String(item.retries),
    item.audienceId,
    item.threshold.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toWeightedEscalationMilestoneViews(items: WeightedEscalationMilestone[]): WeightedEscalationMilestoneView[] {
  const views: WeightedEscalationMilestoneView[] = [];
  for (const item of items) {
    views.push(toWeightedEscalationMilestoneView(item));
  }
  return views;
}

export function sumWeightedEscalationMilestoneView(view: WeightedEscalationMilestoneView): number {
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  return parsedPriority + parsedRetries + parsedThreshold;
}
