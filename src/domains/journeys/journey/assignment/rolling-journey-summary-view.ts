import * as text from "../../../../kit/text.js";
import { RollingJourneySummary } from "./rolling-journey-summary.js";

/** How screens and exports show a rolling journey summary. */
export class RollingJourneySummaryView {
  code: string;
  name: string;
  timezone: string;
  phone: string;
  priority: string;
  notes: string;
  category: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    timezone: string,
    phone: string,
    priority: string,
    notes: string,
    category: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.timezone = timezone;
    this.phone = phone;
    this.priority = priority;
    this.notes = notes;
    this.category = category;
    this.statusLabel = statusLabel;
  }
}

export function toRollingJourneySummaryView(item: RollingJourneySummary): RollingJourneySummaryView {
  return new RollingJourneySummaryView(
    text.truncate(item.code, 120),
    text.truncate(item.name, 80),
    text.truncate(item.timezone, 40),
    item.phone,
    String(item.priority),
    item.notes,
    item.category,
    `${item.status}`.toUpperCase(),
  );
}

export function toRollingJourneySummaryViews(items: RollingJourneySummary[]): RollingJourneySummaryView[] {
  const views: RollingJourneySummaryView[] = [];
  for (const item of items) {
    views.push(toRollingJourneySummaryView(item));
  }
  return views;
}

export function sumRollingJourneySummaryView(view: RollingJourneySummaryView): number {
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  return parsedPriority;
}
