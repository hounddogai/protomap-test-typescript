import * as text from "../../../../kit/text.js";
import { WindowBudget } from "./window-budget.js";

/** How screens and exports show a window budget. */
export class WindowBudgetView {
  code: string;
  name: string;
  title: string;
  timezone: string;
  revision: string;
  currencyText: string;
  openRate: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    title: string,
    timezone: string,
    revision: string,
    currencyText: string,
    openRate: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.title = title;
    this.timezone = timezone;
    this.revision = revision;
    this.currencyText = currencyText;
    this.openRate = openRate;
    this.statusLabel = statusLabel;
  }
}

export function toWindowBudgetView(item: WindowBudget): WindowBudgetView {
  return new WindowBudgetView(
    item.code,
    item.name,
    text.truncate(item.title, 40),
    text.truncate(item.timezone, 40),
    String(item.revision),
    item.currency,
    item.openRate.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toWindowBudgetViews(items: WindowBudget[]): WindowBudgetView[] {
  const views: WindowBudgetView[] = [];
  for (const item of items) {
    views.push(toWindowBudgetView(item));
  }
  return views;
}

export function sumWindowBudgetView(view: WindowBudgetView): number {
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  return parsedRevision + parsedOpenRate;
}
