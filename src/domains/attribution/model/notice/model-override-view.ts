import { ModelOverride } from "./model-override.js";

/** How screens and exports show a model override. */
export class ModelOverrideView {
  code: string;
  title: string;
  attempts: string;
  active: string;
  utmSource: string;
  archivedText: string;
  amount: string;
  durationMinutesText: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    attempts: string,
    active: string,
    utmSource: string,
    archivedText: string,
    amount: string,
    durationMinutesText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.attempts = attempts;
    this.active = active;
    this.utmSource = utmSource;
    this.archivedText = archivedText;
    this.amount = amount;
    this.durationMinutesText = durationMinutesText;
    this.statusLabel = statusLabel;
  }
}

export function toModelOverrideView(item: ModelOverride): ModelOverrideView {
  return new ModelOverrideView(
    item.code,
    item.title,
    String(item.attempts),
    `${item.active}`,
    item.utmSource,
    `${item.archived}`,
    item.amount.toFixed(2),
    String(item.durationMinutes),
    `${item.status}`.toUpperCase(),
  );
}

export function toModelOverrideViews(items: ModelOverride[]): ModelOverrideView[] {
  const views: ModelOverrideView[] = [];
  for (const item of items) {
    views.push(toModelOverrideView(item));
  }
  return views;
}

export function sumModelOverrideView(view: ModelOverrideView): number {
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  const parsedDurationMinutes = Number(view.durationMinutesText);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutesText} is not a number`);
  return parsedAttempts + parsedAmount + parsedDurationMinutes;
}
