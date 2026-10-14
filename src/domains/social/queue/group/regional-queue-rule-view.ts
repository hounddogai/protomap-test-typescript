import * as text from "../../../../kit/text.js";
import { RegionalQueueRule } from "./regional-queue-rule.js";

/** How screens and exports show a regional queue rule. */
export class RegionalQueueRuleView {
  codeText: string;
  name: string;
  label: string;
  utmSource: string;
  categoryText: string;
  createdAt: string;
  reviewer: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    label: string,
    utmSource: string,
    categoryText: string,
    createdAt: string,
    reviewer: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.label = label;
    this.utmSource = utmSource;
    this.categoryText = categoryText;
    this.createdAt = createdAt;
    this.reviewer = reviewer;
    this.statusLabel = statusLabel;
  }
}

export function toRegionalQueueRuleView(item: RegionalQueueRule): RegionalQueueRuleView {
  return new RegionalQueueRuleView(
    text.truncate(item.code, 80),
    item.name,
    text.truncate(item.label, 80),
    item.utmSource,
    item.category,
    String(item.createdAt),
    item.reviewer,
    `${item.status}`.toUpperCase(),
  );
}

export function toRegionalQueueRuleViews(items: RegionalQueueRule[]): RegionalQueueRuleView[] {
  const views: RegionalQueueRuleView[] = [];
  for (const item of items) {
    views.push(toRegionalQueueRuleView(item));
  }
  return views;
}

export function sumRegionalQueueRuleView(view: RegionalQueueRuleView): number {
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  return parsedCreatedAt;
}
