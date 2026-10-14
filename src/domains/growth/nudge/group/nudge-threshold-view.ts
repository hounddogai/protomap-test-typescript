import * as text from "../../../../kit/text.js";
import { NudgeThreshold } from "./nudge-threshold.js";

/** How screens and exports show a nudge threshold. */
export class NudgeThresholdView {
  code: string;
  labelText: string;
  attempts: string;
  locale: string;
  margin: string;
  notes: string;
  cost: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    attempts: string,
    locale: string,
    margin: string,
    notes: string,
    cost: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.attempts = attempts;
    this.locale = locale;
    this.margin = margin;
    this.notes = notes;
    this.cost = cost;
    this.statusLabel = statusLabel;
  }
}

export function toNudgeThresholdView(item: NudgeThreshold): NudgeThresholdView {
  return new NudgeThresholdView(
    item.code,
    text.truncate(item.label, 120),
    String(item.attempts),
    item.locale,
    item.margin.toFixed(2),
    item.notes,
    item.cost.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toNudgeThresholdViews(items: NudgeThreshold[]): NudgeThresholdView[] {
  const views: NudgeThresholdView[] = [];
  for (const item of items) {
    views.push(toNudgeThresholdView(item));
  }
  return views;
}

export function sumNudgeThresholdView(view: NudgeThresholdView): number {
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  const parsedMargin = Number(view.margin);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.margin} is not a number`);
  const parsedCost = Number(view.cost);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.cost} is not a number`);
  return parsedAttempts + parsedMargin + parsedCost;
}
