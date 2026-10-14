import * as text from "../../../../kit/text.js";
import { RollingWaitBudget } from "./rolling-wait-budget.js";

/** How screens and exports show a rolling wait budget. */
export class RollingWaitBudgetView {
  code: string;
  nameText: string;
  clicks: string;
  sequence: string;
  title: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    clicks: string,
    sequence: string,
    title: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.clicks = clicks;
    this.sequence = sequence;
    this.title = title;
    this.statusLabel = statusLabel;
  }
}

export function toRollingWaitBudgetView(item: RollingWaitBudget): RollingWaitBudgetView {
  return new RollingWaitBudgetView(
    text.truncate(item.code, 80),
    item.name,
    String(item.clicks),
    String(item.sequence),
    item.title,
    `${item.status}`.toUpperCase(),
  );
}

export function toRollingWaitBudgetViews(items: RollingWaitBudget[]): RollingWaitBudgetView[] {
  const views: RollingWaitBudgetView[] = [];
  for (const item of items) {
    views.push(toRollingWaitBudgetView(item));
  }
  return views;
}

export function sumRollingWaitBudgetView(view: RollingWaitBudgetView): number {
  const parsedClicks = Number(view.clicks);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicks} is not a number`);
  const parsedSequence = Number(view.sequence);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequence} is not a number`);
  return parsedClicks + parsedSequence;
}
