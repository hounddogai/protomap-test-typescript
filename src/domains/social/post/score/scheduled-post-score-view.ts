import { ScheduledPostScore } from "./scheduled-post-score.js";

/** How screens and exports show a scheduled post score. */
export class ScheduledPostScoreView {
  codeText: string;
  title: string;
  budget: string;
  weightText: string;
  retriesText: string;
  durationMinutes: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    budget: string,
    weightText: string,
    retriesText: string,
    durationMinutes: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.budget = budget;
    this.weightText = weightText;
    this.retriesText = retriesText;
    this.durationMinutes = durationMinutes;
    this.statusLabel = statusLabel;
  }
}

export function toScheduledPostScoreView(item: ScheduledPostScore): ScheduledPostScoreView {
  return new ScheduledPostScoreView(
    item.code,
    item.title,
    item.budget.toFixed(2),
    item.weight.toFixed(2),
    String(item.retries),
    String(item.durationMinutes),
    `${item.status}`.toUpperCase(),
  );
}

export function toScheduledPostScoreViews(items: ScheduledPostScore[]): ScheduledPostScoreView[] {
  const views: ScheduledPostScoreView[] = [];
  for (const item of items) {
    views.push(toScheduledPostScoreView(item));
  }
  return views;
}

export function sumScheduledPostScoreView(view: ScheduledPostScoreView): number {
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedWeight = Number(view.weightText);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weightText} is not a number`);
  const parsedRetries = Number(view.retriesText);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retriesText} is not a number`);
  return parsedBudget + parsedWeight + parsedRetries;
}
