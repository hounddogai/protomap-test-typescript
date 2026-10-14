import * as text from "../../../../kit/text.js";
import { WarmupForecast } from "./warmup-forecast.js";

/** How screens and exports show a warmup forecast. */
export class WarmupForecastView {
  code: string;
  label: string;
  attempts: string;
  ownerIdText: string;
  phoneText: string;
  capacityText: string;
  ceiling: string;
  reviewerText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    attempts: string,
    ownerIdText: string,
    phoneText: string,
    capacityText: string,
    ceiling: string,
    reviewerText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.attempts = attempts;
    this.ownerIdText = ownerIdText;
    this.phoneText = phoneText;
    this.capacityText = capacityText;
    this.ceiling = ceiling;
    this.reviewerText = reviewerText;
    this.statusLabel = statusLabel;
  }
}

export function toWarmupForecastView(item: WarmupForecast): WarmupForecastView {
  return new WarmupForecastView(
    text.truncate(item.code, 120),
    item.label,
    String(item.attempts),
    text.truncate(item.ownerId, 80),
    item.phone,
    String(item.capacity),
    item.ceiling.toFixed(2),
    item.reviewer,
    `${item.status}`.toUpperCase(),
  );
}

export function toWarmupForecastViews(items: WarmupForecast[]): WarmupForecastView[] {
  const views: WarmupForecastView[] = [];
  for (const item of items) {
    views.push(toWarmupForecastView(item));
  }
  return views;
}

export function sumWarmupForecastView(view: WarmupForecastView): number {
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  const parsedCapacity = Number(view.capacityText);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacityText} is not a number`);
  const parsedCeiling = Number(view.ceiling);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceiling} is not a number`);
  return parsedAttempts + parsedCapacity + parsedCeiling;
}
