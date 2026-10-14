import { AdaptiveExitRuleWindow } from "./adaptive-exit-rule-window.js";

/** How screens and exports show a adaptive exit rule window. */
export class AdaptiveExitRuleWindowView {
  code: string;
  nameText: string;
  visible: string;
  attempts: string;
  minimum: string;
  country: string;
  capacityText: string;
  durationMinutes: string;
  bid: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    visible: string,
    attempts: string,
    minimum: string,
    country: string,
    capacityText: string,
    durationMinutes: string,
    bid: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.visible = visible;
    this.attempts = attempts;
    this.minimum = minimum;
    this.country = country;
    this.capacityText = capacityText;
    this.durationMinutes = durationMinutes;
    this.bid = bid;
    this.statusLabel = statusLabel;
  }
}

export function toAdaptiveExitRuleWindowView(item: AdaptiveExitRuleWindow): AdaptiveExitRuleWindowView {
  return new AdaptiveExitRuleWindowView(
    item.code,
    item.name,
    `${item.visible}`,
    String(item.attempts),
    item.minimum.toFixed(2),
    item.country,
    String(item.capacity),
    String(item.durationMinutes),
    item.bid.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toAdaptiveExitRuleWindowViews(items: AdaptiveExitRuleWindow[]): AdaptiveExitRuleWindowView[] {
  const views: AdaptiveExitRuleWindowView[] = [];
  for (const item of items) {
    views.push(toAdaptiveExitRuleWindowView(item));
  }
  return views;
}

export function sumAdaptiveExitRuleWindowView(view: AdaptiveExitRuleWindowView): number {
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  const parsedMinimum = Number(view.minimum);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimum} is not a number`);
  const parsedCapacity = Number(view.capacityText);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacityText} is not a number`);
  return parsedAttempts + parsedMinimum + parsedCapacity;
}
