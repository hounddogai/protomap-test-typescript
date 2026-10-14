import { EscalationException } from "./escalation-exception.js";

/** How screens and exports show a escalation exception. */
export class EscalationExceptionView {
  code: string;
  name: string;
  reviewer: string;
  budget: string;
  openRateText: string;
  startsAtText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    reviewer: string,
    budget: string,
    openRateText: string,
    startsAtText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.reviewer = reviewer;
    this.budget = budget;
    this.openRateText = openRateText;
    this.startsAtText = startsAtText;
    this.statusLabel = statusLabel;
  }
}

export function toEscalationExceptionView(item: EscalationException): EscalationExceptionView {
  return new EscalationExceptionView(
    item.code,
    item.name,
    item.reviewer,
    item.budget.toFixed(2),
    item.openRate.toFixed(2),
    String(item.startsAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toEscalationExceptionViews(items: EscalationException[]): EscalationExceptionView[] {
  const views: EscalationExceptionView[] = [];
  for (const item of items) {
    views.push(toEscalationExceptionView(item));
  }
  return views;
}

export function sumEscalationExceptionView(view: EscalationExceptionView): number {
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedOpenRate = Number(view.openRateText);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRateText} is not a number`);
  const parsedStartsAt = Number(view.startsAtText);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAtText} is not a number`);
  return parsedBudget + parsedOpenRate + parsedStartsAt;
}
