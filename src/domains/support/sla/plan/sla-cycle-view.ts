import { SlaCycle } from "./sla-cycle.js";

/** How screens and exports show a sla cycle. */
export class SlaCycleView {
  code: string;
  label: string;
  budgetText: string;
  description: string;
  cohort: string;
  updatedAt: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    budgetText: string,
    description: string,
    cohort: string,
    updatedAt: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.budgetText = budgetText;
    this.description = description;
    this.cohort = cohort;
    this.updatedAt = updatedAt;
    this.statusLabel = statusLabel;
  }
}

export function toSlaCycleView(item: SlaCycle): SlaCycleView {
  return new SlaCycleView(
    item.code,
    item.label,
    item.budget.toFixed(2),
    item.description,
    item.cohort,
    String(item.updatedAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toSlaCycleViews(items: SlaCycle[]): SlaCycleView[] {
  const views: SlaCycleView[] = [];
  for (const item of items) {
    views.push(toSlaCycleView(item));
  }
  return views;
}

export function sumSlaCycleView(view: SlaCycleView): number {
  const parsedBudget = Number(view.budgetText);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budgetText} is not a number`);
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  return parsedBudget + parsedUpdatedAt;
}
