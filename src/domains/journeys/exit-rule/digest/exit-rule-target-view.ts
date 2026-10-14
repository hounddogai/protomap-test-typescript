import * as text from "../../../../kit/text.js";
import { ExitRuleTarget } from "./exit-rule-target.js";

/** How screens and exports show a exit rule target. */
export class ExitRuleTargetView {
  codeText: string;
  name: string;
  region: string;
  discountText: string;
  priority: string;
  sequence: string;
  attempts: string;
  timezone: string;
  margin: string;
  batchSize: string;
  limit: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    region: string,
    discountText: string,
    priority: string,
    sequence: string,
    attempts: string,
    timezone: string,
    margin: string,
    batchSize: string,
    limit: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.region = region;
    this.discountText = discountText;
    this.priority = priority;
    this.sequence = sequence;
    this.attempts = attempts;
    this.timezone = timezone;
    this.margin = margin;
    this.batchSize = batchSize;
    this.limit = limit;
    this.statusLabel = statusLabel;
  }
}

export function toExitRuleTargetView(item: ExitRuleTarget): ExitRuleTargetView {
  return new ExitRuleTargetView(
    text.truncate(item.code, 120),
    item.name,
    item.region,
    item.discount.toFixed(2),
    String(item.priority),
    String(item.sequence),
    String(item.attempts),
    item.timezone,
    item.margin.toFixed(2),
    String(item.batchSize),
    String(item.limit),
    `${item.status}`.toUpperCase(),
  );
}

export function toExitRuleTargetViews(items: ExitRuleTarget[]): ExitRuleTargetView[] {
  const views: ExitRuleTargetView[] = [];
  for (const item of items) {
    views.push(toExitRuleTargetView(item));
  }
  return views;
}

export function sumExitRuleTargetView(view: ExitRuleTargetView): number {
  const parsedDiscount = Number(view.discountText);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discountText} is not a number`);
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  const parsedSequence = Number(view.sequence);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequence} is not a number`);
  return parsedDiscount + parsedPriority + parsedSequence;
}
