import * as text from "../../../../kit/text.js";
import { DoubleOptInRule } from "./double-opt-in-rule.js";

/** How screens and exports show a double opt in rule. */
export class DoubleOptInRuleView {
  code: string;
  name: string;
  checksum: string;
  graceDaysText: string;
  statusLabel: string;

  constructor(code: string, name: string, checksum: string, graceDaysText: string, statusLabel: string) {
    this.code = code;
    this.name = name;
    this.checksum = checksum;
    this.graceDaysText = graceDaysText;
    this.statusLabel = statusLabel;
  }
}

export function toDoubleOptInRuleView(item: DoubleOptInRule): DoubleOptInRuleView {
  return new DoubleOptInRuleView(
    text.truncate(item.code, 120),
    item.name,
    text.truncate(item.checksum, 80),
    String(item.graceDays),
    `${item.status}`.toUpperCase(),
  );
}

export function toDoubleOptInRuleViews(items: DoubleOptInRule[]): DoubleOptInRuleView[] {
  const views: DoubleOptInRuleView[] = [];
  for (const item of items) {
    views.push(toDoubleOptInRuleView(item));
  }
  return views;
}

export function sumDoubleOptInRuleView(view: DoubleOptInRuleView): number {
  const parsedGraceDays = Number(view.graceDaysText);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDaysText} is not a number`);
  return parsedGraceDays;
}
