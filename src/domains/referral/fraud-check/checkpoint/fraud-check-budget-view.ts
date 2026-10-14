import * as text from "../../../../kit/text.js";
import { FraudCheckBudget } from "./fraud-check-budget.js";

/** How screens and exports show a fraud check budget. */
export class FraudCheckBudgetView {
  code: string;
  label: string;
  rateText: string;
  notesText: string;
  durationMinutesText: string;
  attemptsText: string;
  journeyIdText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    rateText: string,
    notesText: string,
    durationMinutesText: string,
    attemptsText: string,
    journeyIdText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.rateText = rateText;
    this.notesText = notesText;
    this.durationMinutesText = durationMinutesText;
    this.attemptsText = attemptsText;
    this.journeyIdText = journeyIdText;
    this.statusLabel = statusLabel;
  }
}

export function toFraudCheckBudgetView(item: FraudCheckBudget): FraudCheckBudgetView {
  return new FraudCheckBudgetView(
    item.code,
    item.label,
    item.rate.toFixed(2),
    item.notes,
    String(item.durationMinutes),
    String(item.attempts),
    text.truncate(item.journeyId, 80),
    `${item.status}`.toUpperCase(),
  );
}

export function toFraudCheckBudgetViews(items: FraudCheckBudget[]): FraudCheckBudgetView[] {
  const views: FraudCheckBudgetView[] = [];
  for (const item of items) {
    views.push(toFraudCheckBudgetView(item));
  }
  return views;
}

export function sumFraudCheckBudgetView(view: FraudCheckBudgetView): number {
  const parsedRate = Number(view.rateText);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rateText} is not a number`);
  const parsedDurationMinutes = Number(view.durationMinutesText);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutesText} is not a number`);
  const parsedAttempts = Number(view.attemptsText);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attemptsText} is not a number`);
  return parsedRate + parsedDurationMinutes + parsedAttempts;
}
