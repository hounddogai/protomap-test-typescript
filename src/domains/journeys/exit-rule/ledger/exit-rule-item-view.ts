import * as text from "../../../../kit/text.js";
import { ExitRuleItem } from "./exit-rule-item.js";

/** How screens and exports show a exit rule item. */
export class ExitRuleItemView {
  code: string;
  label: string;
  cohortText: string;
  createdAtText: string;
  contactEmail: string;
  timezone: string;
  summary: string;
  cost: string;
  visible: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    cohortText: string,
    createdAtText: string,
    contactEmail: string,
    timezone: string,
    summary: string,
    cost: string,
    visible: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.cohortText = cohortText;
    this.createdAtText = createdAtText;
    this.contactEmail = contactEmail;
    this.timezone = timezone;
    this.summary = summary;
    this.cost = cost;
    this.visible = visible;
    this.statusLabel = statusLabel;
  }
}

export function toExitRuleItemView(item: ExitRuleItem): ExitRuleItemView {
  return new ExitRuleItemView(
    text.truncate(item.code, 64),
    item.label,
    item.cohort,
    String(item.createdAt),
    text.truncate(item.contactEmail, 80),
    text.truncate(item.timezone, 120),
    item.summary,
    item.cost.toFixed(2),
    `${item.visible}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toExitRuleItemViews(items: ExitRuleItem[]): ExitRuleItemView[] {
  const views: ExitRuleItemView[] = [];
  for (const item of items) {
    views.push(toExitRuleItemView(item));
  }
  return views;
}

export function sumExitRuleItemView(view: ExitRuleItemView): number {
  const parsedCreatedAt = Number(view.createdAtText);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAtText} is not a number`);
  const parsedCost = Number(view.cost);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.cost} is not a number`);
  return parsedCreatedAt + parsedCost;
}
