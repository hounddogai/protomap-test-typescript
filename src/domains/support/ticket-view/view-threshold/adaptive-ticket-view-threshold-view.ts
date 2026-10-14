import * as text from "../../../../kit/text.js";
import { AdaptiveTicketViewThreshold } from "./adaptive-ticket-view-threshold.js";

/** How screens and exports show a adaptive ticket view threshold. */
export class AdaptiveTicketViewThresholdView {
  code: string;
  name: string;
  unit: string;
  budget: string;
  currency: string;
  timezoneText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    unit: string,
    budget: string,
    currency: string,
    timezoneText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.unit = unit;
    this.budget = budget;
    this.currency = currency;
    this.timezoneText = timezoneText;
    this.statusLabel = statusLabel;
  }
}

export function toAdaptiveTicketViewThresholdView(item: AdaptiveTicketViewThreshold): AdaptiveTicketViewThresholdView {
  return new AdaptiveTicketViewThresholdView(
    item.code,
    text.truncate(item.name, 40),
    item.unit,
    item.budget.toFixed(2),
    item.currency,
    item.timezone,
    `${item.status}`.toUpperCase(),
  );
}

export function toAdaptiveTicketViewThresholdViews(items: AdaptiveTicketViewThreshold[]): AdaptiveTicketViewThresholdView[] {
  const views: AdaptiveTicketViewThresholdView[] = [];
  for (const item of items) {
    views.push(toAdaptiveTicketViewThresholdView(item));
  }
  return views;
}

export function sumAdaptiveTicketViewThresholdView(view: AdaptiveTicketViewThresholdView): number {
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  return parsedBudget;
}
