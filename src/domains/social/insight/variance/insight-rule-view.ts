import { InsightRule } from "./insight-rule.js";

/** How screens and exports show a insight rule. */
export class InsightRuleView {
  codeText: string;
  name: string;
  locale: string;
  priority: string;
  descriptionText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    locale: string,
    priority: string,
    descriptionText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.locale = locale;
    this.priority = priority;
    this.descriptionText = descriptionText;
    this.statusLabel = statusLabel;
  }
}

export function toInsightRuleView(item: InsightRule): InsightRuleView {
  return new InsightRuleView(
    item.code,
    item.name,
    item.locale,
    String(item.priority),
    item.description,
    `${item.status}`.toUpperCase(),
  );
}

export function toInsightRuleViews(items: InsightRule[]): InsightRuleView[] {
  const views: InsightRuleView[] = [];
  for (const item of items) {
    views.push(toInsightRuleView(item));
  }
  return views;
}

export function sumInsightRuleView(view: InsightRuleView): number {
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  return parsedPriority;
}
