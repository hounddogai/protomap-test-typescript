import { StreakRule } from "./streak-rule.js";

/** How screens and exports show a streak rule. */
export class StreakRuleView {
  code: string;
  label: string;
  journeyId: string;
  summary: string;
  source: string;
  margin: string;
  revisionText: string;
  createdAt: string;
  maximum: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    journeyId: string,
    summary: string,
    source: string,
    margin: string,
    revisionText: string,
    createdAt: string,
    maximum: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.journeyId = journeyId;
    this.summary = summary;
    this.source = source;
    this.margin = margin;
    this.revisionText = revisionText;
    this.createdAt = createdAt;
    this.maximum = maximum;
    this.statusLabel = statusLabel;
  }
}

export function toStreakRuleView(item: StreakRule): StreakRuleView {
  return new StreakRuleView(
    item.code,
    item.label,
    item.journeyId,
    item.summary,
    item.source,
    item.margin.toFixed(2),
    String(item.revision),
    String(item.createdAt),
    item.maximum.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toStreakRuleViews(items: StreakRule[]): StreakRuleView[] {
  const views: StreakRuleView[] = [];
  for (const item of items) {
    views.push(toStreakRuleView(item));
  }
  return views;
}

export function sumStreakRuleView(view: StreakRuleView): number {
  const parsedMargin = Number(view.margin);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.margin} is not a number`);
  const parsedRevision = Number(view.revisionText);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revisionText} is not a number`);
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  return parsedMargin + parsedRevision + parsedCreatedAt;
}
