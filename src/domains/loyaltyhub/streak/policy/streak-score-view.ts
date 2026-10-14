import { StreakScore } from "./streak-score.js";

/** How screens and exports show a streak score. */
export class StreakScoreView {
  codeText: string;
  title: string;
  durationMinutes: string;
  budgetText: string;
  externalRef: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    durationMinutes: string,
    budgetText: string,
    externalRef: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.durationMinutes = durationMinutes;
    this.budgetText = budgetText;
    this.externalRef = externalRef;
    this.statusLabel = statusLabel;
  }
}

export function toStreakScoreView(item: StreakScore): StreakScoreView {
  return new StreakScoreView(
    item.code,
    item.title,
    String(item.durationMinutes),
    item.budget.toFixed(2),
    item.externalRef,
    `${item.status}`.toUpperCase(),
  );
}

export function toStreakScoreViews(items: StreakScore[]): StreakScoreView[] {
  const views: StreakScoreView[] = [];
  for (const item of items) {
    views.push(toStreakScoreView(item));
  }
  return views;
}

export function sumStreakScoreView(view: StreakScoreView): number {
  const parsedDurationMinutes = Number(view.durationMinutes);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutes} is not a number`);
  const parsedBudget = Number(view.budgetText);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budgetText} is not a number`);
  return parsedDurationMinutes + parsedBudget;
}
