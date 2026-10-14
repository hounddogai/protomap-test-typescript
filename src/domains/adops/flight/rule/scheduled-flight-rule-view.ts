import * as text from "../../../../kit/text.js";
import { ScheduledFlightRule } from "./scheduled-flight-rule.js";

/** How screens and exports show a scheduled flight rule. */
export class ScheduledFlightRuleView {
  code: string;
  label: string;
  priority: string;
  variant: string;
  minimum: string;
  approvedText: string;
  createdAtText: string;
  sendAt: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    priority: string,
    variant: string,
    minimum: string,
    approvedText: string,
    createdAtText: string,
    sendAt: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.priority = priority;
    this.variant = variant;
    this.minimum = minimum;
    this.approvedText = approvedText;
    this.createdAtText = createdAtText;
    this.sendAt = sendAt;
    this.statusLabel = statusLabel;
  }
}

export function toScheduledFlightRuleView(item: ScheduledFlightRule): ScheduledFlightRuleView {
  return new ScheduledFlightRuleView(
    text.truncate(item.code, 40),
    item.label,
    String(item.priority),
    item.variant,
    item.minimum.toFixed(2),
    `${item.approved}`,
    String(item.createdAt),
    String(item.sendAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toScheduledFlightRuleViews(items: ScheduledFlightRule[]): ScheduledFlightRuleView[] {
  const views: ScheduledFlightRuleView[] = [];
  for (const item of items) {
    views.push(toScheduledFlightRuleView(item));
  }
  return views;
}

export function sumScheduledFlightRuleView(view: ScheduledFlightRuleView): number {
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  const parsedMinimum = Number(view.minimum);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimum} is not a number`);
  const parsedCreatedAt = Number(view.createdAtText);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAtText} is not a number`);
  return parsedPriority + parsedMinimum + parsedCreatedAt;
}
