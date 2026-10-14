import { GlobalWaitBudget } from "./global-wait-budget.js";

/** How screens and exports show a global wait budget. */
export class GlobalWaitBudgetView {
  code: string;
  label: string;
  visible: string;
  clicks: string;
  externalRef: string;
  windowDaysText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    visible: string,
    clicks: string,
    externalRef: string,
    windowDaysText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.visible = visible;
    this.clicks = clicks;
    this.externalRef = externalRef;
    this.windowDaysText = windowDaysText;
    this.statusLabel = statusLabel;
  }
}

export function toGlobalWaitBudgetView(item: GlobalWaitBudget): GlobalWaitBudgetView {
  return new GlobalWaitBudgetView(
    item.code,
    item.label,
    `${item.visible}`,
    String(item.clicks),
    item.externalRef,
    String(item.windowDays),
    `${item.status}`.toUpperCase(),
  );
}

export function toGlobalWaitBudgetViews(items: GlobalWaitBudget[]): GlobalWaitBudgetView[] {
  const views: GlobalWaitBudgetView[] = [];
  for (const item of items) {
    views.push(toGlobalWaitBudgetView(item));
  }
  return views;
}

export function sumGlobalWaitBudgetView(view: GlobalWaitBudgetView): number {
  const parsedClicks = Number(view.clicks);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicks} is not a number`);
  const parsedWindowDays = Number(view.windowDaysText);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDaysText} is not a number`);
  return parsedClicks + parsedWindowDays;
}
