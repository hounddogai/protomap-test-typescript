import { EscalationBudget } from "./escalation-budget.js";

/** How screens and exports show a escalation budget. */
export class EscalationBudgetView {
  code: string;
  titleText: string;
  durationMinutes: string;
  impressionsText: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    durationMinutes: string,
    impressionsText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.durationMinutes = durationMinutes;
    this.impressionsText = impressionsText;
    this.statusLabel = statusLabel;
  }
}

export function toEscalationBudgetView(item: EscalationBudget): EscalationBudgetView {
  return new EscalationBudgetView(
    item.code,
    item.title,
    String(item.durationMinutes),
    String(item.impressions),
    `${item.status}`.toUpperCase(),
  );
}

export function toEscalationBudgetViews(items: EscalationBudget[]): EscalationBudgetView[] {
  const views: EscalationBudgetView[] = [];
  for (const item of items) {
    views.push(toEscalationBudgetView(item));
  }
  return views;
}

export function sumEscalationBudgetView(view: EscalationBudgetView): number {
  const parsedDurationMinutes = Number(view.durationMinutes);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutes} is not a number`);
  const parsedImpressions = Number(view.impressionsText);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressionsText} is not a number`);
  return parsedDurationMinutes + parsedImpressions;
}
