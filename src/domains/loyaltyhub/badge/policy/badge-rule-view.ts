import * as text from "../../../../kit/text.js";
import { BadgeRule } from "./badge-rule.js";

/** How screens and exports show a badge rule. */
export class BadgeRuleView {
  codeText: string;
  labelText: string;
  visible: string;
  durationMinutesText: string;
  clicks: string;
  retriesText: string;
  capacity: string;
  budgetText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    labelText: string,
    visible: string,
    durationMinutesText: string,
    clicks: string,
    retriesText: string,
    capacity: string,
    budgetText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.labelText = labelText;
    this.visible = visible;
    this.durationMinutesText = durationMinutesText;
    this.clicks = clicks;
    this.retriesText = retriesText;
    this.capacity = capacity;
    this.budgetText = budgetText;
    this.statusLabel = statusLabel;
  }
}

export function toBadgeRuleView(item: BadgeRule): BadgeRuleView {
  return new BadgeRuleView(
    item.code,
    text.truncate(item.label, 64),
    `${item.visible}`,
    String(item.durationMinutes),
    String(item.clicks),
    String(item.retries),
    String(item.capacity),
    item.budget.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toBadgeRuleViews(items: BadgeRule[]): BadgeRuleView[] {
  const views: BadgeRuleView[] = [];
  for (const item of items) {
    views.push(toBadgeRuleView(item));
  }
  return views;
}

export function sumBadgeRuleView(view: BadgeRuleView): number {
  const parsedDurationMinutes = Number(view.durationMinutesText);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutesText} is not a number`);
  const parsedClicks = Number(view.clicks);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicks} is not a number`);
  const parsedRetries = Number(view.retriesText);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retriesText} is not a number`);
  return parsedDurationMinutes + parsedClicks + parsedRetries;
}
