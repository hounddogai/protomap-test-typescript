import * as text from "../../../../kit/text.js";
import { ActivationBudget } from "./activation-budget.js";

/** How screens and exports show a activation budget. */
export class ActivationBudgetView {
  code: string;
  title: string;
  activeText: string;
  threshold: string;
  windowDays: string;
  ceilingText: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    activeText: string,
    threshold: string,
    windowDays: string,
    ceilingText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.activeText = activeText;
    this.threshold = threshold;
    this.windowDays = windowDays;
    this.ceilingText = ceilingText;
    this.statusLabel = statusLabel;
  }
}

export function toActivationBudgetView(item: ActivationBudget): ActivationBudgetView {
  return new ActivationBudgetView(
    item.code,
    text.truncate(item.title, 40),
    `${item.active}`,
    item.threshold.toFixed(2),
    String(item.windowDays),
    item.ceiling.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toActivationBudgetViews(items: ActivationBudget[]): ActivationBudgetView[] {
  const views: ActivationBudgetView[] = [];
  for (const item of items) {
    views.push(toActivationBudgetView(item));
  }
  return views;
}

export function sumActivationBudgetView(view: ActivationBudgetView): number {
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  const parsedWindowDays = Number(view.windowDays);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDays} is not a number`);
  const parsedCeiling = Number(view.ceilingText);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceilingText} is not a number`);
  return parsedThreshold + parsedWindowDays + parsedCeiling;
}
