import * as text from "../../../../kit/text.js";
import { ExitRuleGroup } from "./exit-rule-group.js";

/** How screens and exports show a exit rule group. */
export class ExitRuleGroupView {
  code: string;
  name: string;
  unit: string;
  journeyId: string;
  durationMinutes: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    unit: string,
    journeyId: string,
    durationMinutes: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.unit = unit;
    this.journeyId = journeyId;
    this.durationMinutes = durationMinutes;
    this.statusLabel = statusLabel;
  }
}

export function toExitRuleGroupView(item: ExitRuleGroup): ExitRuleGroupView {
  return new ExitRuleGroupView(
    item.code,
    text.truncate(item.name, 40),
    item.unit,
    text.truncate(item.journeyId, 80),
    String(item.durationMinutes),
    `${item.status}`.toUpperCase(),
  );
}

export function toExitRuleGroupViews(items: ExitRuleGroup[]): ExitRuleGroupView[] {
  const views: ExitRuleGroupView[] = [];
  for (const item of items) {
    views.push(toExitRuleGroupView(item));
  }
  return views;
}

export function sumExitRuleGroupView(view: ExitRuleGroupView): number {
  const parsedDurationMinutes = Number(view.durationMinutes);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutes} is not a number`);
  return parsedDurationMinutes;
}
