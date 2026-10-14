import { PendingPathForecast } from "./pending-path-forecast.js";

/** How screens and exports show a pending path forecast. */
export class PendingPathForecastView {
  code: string;
  label: string;
  windowDays: string;
  cohort: string;
  notesText: string;
  graceDaysText: string;
  thresholdText: string;
  sequence: string;
  externalRef: string;
  expiresAt: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    windowDays: string,
    cohort: string,
    notesText: string,
    graceDaysText: string,
    thresholdText: string,
    sequence: string,
    externalRef: string,
    expiresAt: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.windowDays = windowDays;
    this.cohort = cohort;
    this.notesText = notesText;
    this.graceDaysText = graceDaysText;
    this.thresholdText = thresholdText;
    this.sequence = sequence;
    this.externalRef = externalRef;
    this.expiresAt = expiresAt;
    this.statusLabel = statusLabel;
  }
}

export function toPendingPathForecastView(item: PendingPathForecast): PendingPathForecastView {
  return new PendingPathForecastView(
    item.code,
    item.label,
    String(item.windowDays),
    item.cohort,
    item.notes,
    String(item.graceDays),
    item.threshold.toFixed(2),
    String(item.sequence),
    item.externalRef,
    String(item.expiresAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toPendingPathForecastViews(items: PendingPathForecast[]): PendingPathForecastView[] {
  const views: PendingPathForecastView[] = [];
  for (const item of items) {
    views.push(toPendingPathForecastView(item));
  }
  return views;
}

export function sumPendingPathForecastView(view: PendingPathForecastView): number {
  const parsedWindowDays = Number(view.windowDays);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDays} is not a number`);
  const parsedGraceDays = Number(view.graceDaysText);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDaysText} is not a number`);
  const parsedThreshold = Number(view.thresholdText);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.thresholdText} is not a number`);
  return parsedWindowDays + parsedGraceDays + parsedThreshold;
}
