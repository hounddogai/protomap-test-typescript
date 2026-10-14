import { StepMilestone } from "./step-milestone.js";

/** How screens and exports show a step milestone. */
export class StepMilestoneView {
  code: string;
  title: string;
  clicks: string;
  ceiling: string;
  sequence: string;
  countryText: string;
  budgetText: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    clicks: string,
    ceiling: string,
    sequence: string,
    countryText: string,
    budgetText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.clicks = clicks;
    this.ceiling = ceiling;
    this.sequence = sequence;
    this.countryText = countryText;
    this.budgetText = budgetText;
    this.statusLabel = statusLabel;
  }
}

export function toStepMilestoneView(item: StepMilestone): StepMilestoneView {
  return new StepMilestoneView(
    item.code,
    item.title,
    String(item.clicks),
    item.ceiling.toFixed(2),
    String(item.sequence),
    item.country,
    item.budget.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toStepMilestoneViews(items: StepMilestone[]): StepMilestoneView[] {
  const views: StepMilestoneView[] = [];
  for (const item of items) {
    views.push(toStepMilestoneView(item));
  }
  return views;
}

export function sumStepMilestoneView(view: StepMilestoneView): number {
  const parsedClicks = Number(view.clicks);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicks} is not a number`);
  const parsedCeiling = Number(view.ceiling);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceiling} is not a number`);
  const parsedSequence = Number(view.sequence);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequence} is not a number`);
  return parsedClicks + parsedCeiling + parsedSequence;
}
