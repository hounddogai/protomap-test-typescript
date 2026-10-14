import { PrimaryLevelBudget } from "./primary-level-budget.js";

/** How screens and exports show a primary level budget. */
export class PrimaryLevelBudgetView {
  code: string;
  label: string;
  revision: string;
  budgetText: string;
  marginText: string;
  sequenceText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    revision: string,
    budgetText: string,
    marginText: string,
    sequenceText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.revision = revision;
    this.budgetText = budgetText;
    this.marginText = marginText;
    this.sequenceText = sequenceText;
    this.statusLabel = statusLabel;
  }
}

export function toPrimaryLevelBudgetView(item: PrimaryLevelBudget): PrimaryLevelBudgetView {
  return new PrimaryLevelBudgetView(
    item.code,
    item.label,
    String(item.revision),
    item.budget.toFixed(2),
    item.margin.toFixed(2),
    String(item.sequence),
    `${item.status}`.toUpperCase(),
  );
}

export function toPrimaryLevelBudgetViews(items: PrimaryLevelBudget[]): PrimaryLevelBudgetView[] {
  const views: PrimaryLevelBudgetView[] = [];
  for (const item of items) {
    views.push(toPrimaryLevelBudgetView(item));
  }
  return views;
}

export function sumPrimaryLevelBudgetView(view: PrimaryLevelBudgetView): number {
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  const parsedBudget = Number(view.budgetText);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budgetText} is not a number`);
  const parsedMargin = Number(view.marginText);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.marginText} is not a number`);
  return parsedRevision + parsedBudget + parsedMargin;
}
