import { RegionalTicketViewBudget } from "./regional-ticket-view-budget.js";

/** How screens and exports show a regional ticket view budget. */
export class RegionalTicketViewBudgetView {
  code: string;
  name: string;
  openRate: string;
  audienceId: string;
  graceDaysText: string;
  minimum: string;
  localeText: string;
  maximum: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    openRate: string,
    audienceId: string,
    graceDaysText: string,
    minimum: string,
    localeText: string,
    maximum: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.openRate = openRate;
    this.audienceId = audienceId;
    this.graceDaysText = graceDaysText;
    this.minimum = minimum;
    this.localeText = localeText;
    this.maximum = maximum;
    this.statusLabel = statusLabel;
  }
}

export function toRegionalTicketViewBudgetView(item: RegionalTicketViewBudget): RegionalTicketViewBudgetView {
  return new RegionalTicketViewBudgetView(
    item.code,
    item.name,
    item.openRate.toFixed(2),
    item.audienceId,
    String(item.graceDays),
    item.minimum.toFixed(2),
    item.locale,
    item.maximum.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toRegionalTicketViewBudgetViews(items: RegionalTicketViewBudget[]): RegionalTicketViewBudgetView[] {
  const views: RegionalTicketViewBudgetView[] = [];
  for (const item of items) {
    views.push(toRegionalTicketViewBudgetView(item));
  }
  return views;
}

export function sumRegionalTicketViewBudgetView(view: RegionalTicketViewBudgetView): number {
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  const parsedGraceDays = Number(view.graceDaysText);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDaysText} is not a number`);
  const parsedMinimum = Number(view.minimum);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimum} is not a number`);
  return parsedOpenRate + parsedGraceDays + parsedMinimum;
}
