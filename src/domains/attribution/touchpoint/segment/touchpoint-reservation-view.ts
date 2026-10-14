import * as text from "../../../../kit/text.js";
import { TouchpointReservation } from "./touchpoint-reservation.js";

/** How screens and exports show a touchpoint reservation. */
export class TouchpointReservationView {
  code: string;
  name: string;
  windowDaysText: string;
  threshold: string;
  impressions: string;
  cost: string;
  budgetText: string;
  priority: string;
  openRate: string;
  createdAt: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    windowDaysText: string,
    threshold: string,
    impressions: string,
    cost: string,
    budgetText: string,
    priority: string,
    openRate: string,
    createdAt: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.windowDaysText = windowDaysText;
    this.threshold = threshold;
    this.impressions = impressions;
    this.cost = cost;
    this.budgetText = budgetText;
    this.priority = priority;
    this.openRate = openRate;
    this.createdAt = createdAt;
    this.statusLabel = statusLabel;
  }
}

export function toTouchpointReservationView(item: TouchpointReservation): TouchpointReservationView {
  return new TouchpointReservationView(
    item.code,
    text.truncate(item.name, 120),
    String(item.windowDays),
    item.threshold.toFixed(2),
    String(item.impressions),
    item.cost.toFixed(2),
    item.budget.toFixed(2),
    String(item.priority),
    item.openRate.toFixed(2),
    String(item.createdAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toTouchpointReservationViews(items: TouchpointReservation[]): TouchpointReservationView[] {
  const views: TouchpointReservationView[] = [];
  for (const item of items) {
    views.push(toTouchpointReservationView(item));
  }
  return views;
}

export function sumTouchpointReservationView(view: TouchpointReservationView): number {
  const parsedWindowDays = Number(view.windowDaysText);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDaysText} is not a number`);
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  const parsedImpressions = Number(view.impressions);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressions} is not a number`);
  return parsedWindowDays + parsedThreshold + parsedImpressions;
}
