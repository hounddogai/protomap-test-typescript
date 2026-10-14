import * as text from "../../../../kit/text.js";
import { EscalationSummary } from "./escalation-summary.js";

/** How screens and exports show a escalation summary. */
export class EscalationSummaryView {
  code: string;
  label: string;
  variant: string;
  priority: string;
  windowDaysText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    variant: string,
    priority: string,
    windowDaysText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.variant = variant;
    this.priority = priority;
    this.windowDaysText = windowDaysText;
    this.statusLabel = statusLabel;
  }
}

export function toEscalationSummaryView(item: EscalationSummary): EscalationSummaryView {
  return new EscalationSummaryView(
    text.truncate(item.code, 64),
    text.truncate(item.label, 64),
    item.variant,
    String(item.priority),
    String(item.windowDays),
    `${item.status}`.toUpperCase(),
  );
}

export function toEscalationSummaryViews(items: EscalationSummary[]): EscalationSummaryView[] {
  const views: EscalationSummaryView[] = [];
  for (const item of items) {
    views.push(toEscalationSummaryView(item));
  }
  return views;
}

export function sumEscalationSummaryView(view: EscalationSummaryView): number {
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  const parsedWindowDays = Number(view.windowDaysText);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDaysText} is not a number`);
  return parsedPriority + parsedWindowDays;
}
