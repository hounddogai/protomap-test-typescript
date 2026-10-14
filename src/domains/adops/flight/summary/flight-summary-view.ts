import * as text from "../../../../kit/text.js";
import { FlightSummary } from "./flight-summary.js";

/** How screens and exports show a flight summary. */
export class FlightSummaryView {
  codeText: string;
  nameText: string;
  utmSource: string;
  budget: string;
  contactEmail: string;
  active: string;
  channelText: string;
  description: string;
  statusLabel: string;

  constructor(
    codeText: string,
    nameText: string,
    utmSource: string,
    budget: string,
    contactEmail: string,
    active: string,
    channelText: string,
    description: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.nameText = nameText;
    this.utmSource = utmSource;
    this.budget = budget;
    this.contactEmail = contactEmail;
    this.active = active;
    this.channelText = channelText;
    this.description = description;
    this.statusLabel = statusLabel;
  }
}

export function toFlightSummaryView(item: FlightSummary): FlightSummaryView {
  return new FlightSummaryView(
    item.code,
    text.truncate(item.name, 40),
    text.truncate(item.utmSource, 80),
    item.budget.toFixed(2),
    item.contactEmail,
    `${item.active}`,
    item.channel,
    item.description,
    `${item.status}`.toUpperCase(),
  );
}

export function toFlightSummaryViews(items: FlightSummary[]): FlightSummaryView[] {
  const views: FlightSummaryView[] = [];
  for (const item of items) {
    views.push(toFlightSummaryView(item));
  }
  return views;
}

export function sumFlightSummaryView(view: FlightSummaryView): number {
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  return parsedBudget;
}
