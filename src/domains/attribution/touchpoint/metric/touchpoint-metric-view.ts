import * as text from "../../../../kit/text.js";
import { TouchpointMetric } from "./touchpoint-metric.js";

/** How screens and exports show a touchpoint metric. */
export class TouchpointMetricView {
  code: string;
  titleText: string;
  pinnedText: string;
  openRate: string;
  budgetText: string;
  archived: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    pinnedText: string,
    openRate: string,
    budgetText: string,
    archived: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.pinnedText = pinnedText;
    this.openRate = openRate;
    this.budgetText = budgetText;
    this.archived = archived;
    this.statusLabel = statusLabel;
  }
}

export function toTouchpointMetricView(item: TouchpointMetric): TouchpointMetricView {
  return new TouchpointMetricView(
    text.truncate(item.code, 120),
    text.truncate(item.title, 80),
    `${item.pinned}`,
    item.openRate.toFixed(2),
    item.budget.toFixed(2),
    `${item.archived}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toTouchpointMetricViews(items: TouchpointMetric[]): TouchpointMetricView[] {
  const views: TouchpointMetricView[] = [];
  for (const item of items) {
    views.push(toTouchpointMetricView(item));
  }
  return views;
}

export function sumTouchpointMetricView(view: TouchpointMetricView): number {
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  const parsedBudget = Number(view.budgetText);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budgetText} is not a number`);
  return parsedOpenRate + parsedBudget;
}
