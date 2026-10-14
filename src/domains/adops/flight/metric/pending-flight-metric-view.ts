import * as text from "../../../../kit/text.js";
import { PendingFlightMetric } from "./pending-flight-metric.js";

/** How screens and exports show a pending flight metric. */
export class PendingFlightMetricView {
  code: string;
  label: string;
  ownerIdText: string;
  priority: string;
  expiresAt: string;
  locale: string;
  ceiling: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    ownerIdText: string,
    priority: string,
    expiresAt: string,
    locale: string,
    ceiling: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.ownerIdText = ownerIdText;
    this.priority = priority;
    this.expiresAt = expiresAt;
    this.locale = locale;
    this.ceiling = ceiling;
    this.statusLabel = statusLabel;
  }
}

export function toPendingFlightMetricView(item: PendingFlightMetric): PendingFlightMetricView {
  return new PendingFlightMetricView(
    item.code,
    item.label,
    text.truncate(item.ownerId, 40),
    String(item.priority),
    String(item.expiresAt),
    item.locale,
    item.ceiling.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toPendingFlightMetricViews(items: PendingFlightMetric[]): PendingFlightMetricView[] {
  const views: PendingFlightMetricView[] = [];
  for (const item of items) {
    views.push(toPendingFlightMetricView(item));
  }
  return views;
}

export function sumPendingFlightMetricView(view: PendingFlightMetricView): number {
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  const parsedExpiresAt = Number(view.expiresAt);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAt} is not a number`);
  const parsedCeiling = Number(view.ceiling);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceiling} is not a number`);
  return parsedPriority + parsedExpiresAt + parsedCeiling;
}
