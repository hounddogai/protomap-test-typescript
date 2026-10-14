import { FunnelSummary } from "./funnel-summary.js";

/** How screens and exports show a funnel summary. */
export class FunnelSummaryView {
  code: string;
  name: string;
  contactEmailText: string;
  durationMinutes: string;
  budgetText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    contactEmailText: string,
    durationMinutes: string,
    budgetText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.contactEmailText = contactEmailText;
    this.durationMinutes = durationMinutes;
    this.budgetText = budgetText;
    this.statusLabel = statusLabel;
  }
}

export function toFunnelSummaryView(item: FunnelSummary): FunnelSummaryView {
  return new FunnelSummaryView(
    item.code,
    item.name,
    item.contactEmail,
    String(item.durationMinutes),
    item.budget.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toFunnelSummaryViews(items: FunnelSummary[]): FunnelSummaryView[] {
  const views: FunnelSummaryView[] = [];
  for (const item of items) {
    views.push(toFunnelSummaryView(item));
  }
  return views;
}

export function sumFunnelSummaryView(view: FunnelSummaryView): number {
  const parsedDurationMinutes = Number(view.durationMinutes);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutes} is not a number`);
  const parsedBudget = Number(view.budgetText);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budgetText} is not a number`);
  return parsedDurationMinutes + parsedBudget;
}
