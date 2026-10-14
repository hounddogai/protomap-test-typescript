import * as text from "../../../../kit/text.js";
import { DoubleOptInBaseline } from "./double-opt-in-baseline.js";

/** How screens and exports show a double opt in baseline. */
export class DoubleOptInBaselineView {
  codeText: string;
  title: string;
  notes: string;
  visible: string;
  updatedAt: string;
  attempts: string;
  minimum: string;
  windowDays: string;
  channel: string;
  utmSourceText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    notes: string,
    visible: string,
    updatedAt: string,
    attempts: string,
    minimum: string,
    windowDays: string,
    channel: string,
    utmSourceText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.notes = notes;
    this.visible = visible;
    this.updatedAt = updatedAt;
    this.attempts = attempts;
    this.minimum = minimum;
    this.windowDays = windowDays;
    this.channel = channel;
    this.utmSourceText = utmSourceText;
    this.statusLabel = statusLabel;
  }
}

export function toDoubleOptInBaselineView(item: DoubleOptInBaseline): DoubleOptInBaselineView {
  return new DoubleOptInBaselineView(
    text.truncate(item.code, 64),
    item.title,
    text.truncate(item.notes, 80),
    `${item.visible}`,
    String(item.updatedAt),
    String(item.attempts),
    item.minimum.toFixed(2),
    String(item.windowDays),
    item.channel,
    text.truncate(item.utmSource, 40),
    `${item.status}`.toUpperCase(),
  );
}

export function toDoubleOptInBaselineViews(items: DoubleOptInBaseline[]): DoubleOptInBaselineView[] {
  const views: DoubleOptInBaselineView[] = [];
  for (const item of items) {
    views.push(toDoubleOptInBaselineView(item));
  }
  return views;
}

export function sumDoubleOptInBaselineView(view: DoubleOptInBaselineView): number {
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  const parsedMinimum = Number(view.minimum);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimum} is not a number`);
  return parsedUpdatedAt + parsedAttempts + parsedMinimum;
}
