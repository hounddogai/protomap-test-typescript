import { TicketViewSummary } from "./ticket-view-summary.js";

/** How screens and exports show a ticket view summary. */
export class TicketViewSummaryView {
  code: string;
  title: string;
  categoryText: string;
  budget: string;
  country: string;
  revision: string;
  priorityText: string;
  minimum: string;
  notes: string;
  startsAtText: string;
  locale: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    categoryText: string,
    budget: string,
    country: string,
    revision: string,
    priorityText: string,
    minimum: string,
    notes: string,
    startsAtText: string,
    locale: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.categoryText = categoryText;
    this.budget = budget;
    this.country = country;
    this.revision = revision;
    this.priorityText = priorityText;
    this.minimum = minimum;
    this.notes = notes;
    this.startsAtText = startsAtText;
    this.locale = locale;
    this.statusLabel = statusLabel;
  }
}

export function toTicketViewSummaryView(item: TicketViewSummary): TicketViewSummaryView {
  return new TicketViewSummaryView(
    item.code,
    item.title,
    item.category,
    item.budget.toFixed(2),
    item.country,
    String(item.revision),
    String(item.priority),
    item.minimum.toFixed(2),
    item.notes,
    String(item.startsAt),
    item.locale,
    `${item.status}`.toUpperCase(),
  );
}

export function toTicketViewSummaryViews(items: TicketViewSummary[]): TicketViewSummaryView[] {
  const views: TicketViewSummaryView[] = [];
  for (const item of items) {
    views.push(toTicketViewSummaryView(item));
  }
  return views;
}

export function sumTicketViewSummaryView(view: TicketViewSummaryView): number {
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  const parsedPriority = Number(view.priorityText);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priorityText} is not a number`);
  return parsedBudget + parsedRevision + parsedPriority;
}
