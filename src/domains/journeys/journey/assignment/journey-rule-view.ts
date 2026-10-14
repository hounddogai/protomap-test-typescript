import * as text from "../../../../kit/text.js";
import { JourneyRule } from "./journey-rule.js";

/** How screens and exports show a journey rule. */
export class JourneyRuleView {
  code: string;
  label: string;
  weightText: string;
  graceDaysText: string;
  floorValue: string;
  priorityText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    weightText: string,
    graceDaysText: string,
    floorValue: string,
    priorityText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.weightText = weightText;
    this.graceDaysText = graceDaysText;
    this.floorValue = floorValue;
    this.priorityText = priorityText;
    this.statusLabel = statusLabel;
  }
}

export function toJourneyRuleView(item: JourneyRule): JourneyRuleView {
  return new JourneyRuleView(
    text.truncate(item.code, 40),
    text.truncate(item.label, 120),
    item.weight.toFixed(2),
    String(item.graceDays),
    item.floorValue.toFixed(2),
    String(item.priority),
    `${item.status}`.toUpperCase(),
  );
}

export function toJourneyRuleViews(items: JourneyRule[]): JourneyRuleView[] {
  const views: JourneyRuleView[] = [];
  for (const item of items) {
    views.push(toJourneyRuleView(item));
  }
  return views;
}

export function sumJourneyRuleView(view: JourneyRuleView): number {
  const parsedWeight = Number(view.weightText);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weightText} is not a number`);
  const parsedGraceDays = Number(view.graceDaysText);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDaysText} is not a number`);
  const parsedFloorValue = Number(view.floorValue);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValue} is not a number`);
  return parsedWeight + parsedGraceDays + parsedFloorValue;
}
