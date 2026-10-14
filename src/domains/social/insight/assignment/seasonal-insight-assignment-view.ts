import * as text from "../../../../kit/text.js";
import { SeasonalInsightAssignment } from "./seasonal-insight-assignment.js";

/** How screens and exports show a seasonal insight assignment. */
export class SeasonalInsightAssignmentView {
  codeText: string;
  name: string;
  journeyIdText: string;
  budgetText: string;
  source: string;
  reviewer: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    journeyIdText: string,
    budgetText: string,
    source: string,
    reviewer: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.journeyIdText = journeyIdText;
    this.budgetText = budgetText;
    this.source = source;
    this.reviewer = reviewer;
    this.statusLabel = statusLabel;
  }
}

export function toSeasonalInsightAssignmentView(item: SeasonalInsightAssignment): SeasonalInsightAssignmentView {
  return new SeasonalInsightAssignmentView(
    item.code,
    item.name,
    item.journeyId,
    item.budget.toFixed(2),
    item.source,
    text.truncate(item.reviewer, 40),
    `${item.status}`.toUpperCase(),
  );
}

export function toSeasonalInsightAssignmentViews(items: SeasonalInsightAssignment[]): SeasonalInsightAssignmentView[] {
  const views: SeasonalInsightAssignmentView[] = [];
  for (const item of items) {
    views.push(toSeasonalInsightAssignmentView(item));
  }
  return views;
}

export function sumSeasonalInsightAssignmentView(view: SeasonalInsightAssignmentView): number {
  const parsedBudget = Number(view.budgetText);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budgetText} is not a number`);
  return parsedBudget;
}
