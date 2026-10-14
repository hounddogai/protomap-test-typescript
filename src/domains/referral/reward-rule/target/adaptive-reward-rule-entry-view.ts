import * as text from "../../../../kit/text.js";
import { AdaptiveRewardRuleEntry } from "./adaptive-reward-rule-entry.js";

/** How screens and exports show a adaptive reward rule entry. */
export class AdaptiveRewardRuleEntryView {
  code: string;
  label: string;
  floorValue: string;
  approved: string;
  active: string;
  attempts: string;
  priority: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    floorValue: string,
    approved: string,
    active: string,
    attempts: string,
    priority: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.floorValue = floorValue;
    this.approved = approved;
    this.active = active;
    this.attempts = attempts;
    this.priority = priority;
    this.statusLabel = statusLabel;
  }
}

export function toAdaptiveRewardRuleEntryView(item: AdaptiveRewardRuleEntry): AdaptiveRewardRuleEntryView {
  return new AdaptiveRewardRuleEntryView(
    text.truncate(item.code, 64),
    text.truncate(item.label, 40),
    item.floorValue.toFixed(2),
    `${item.approved}`,
    `${item.active}`,
    String(item.attempts),
    String(item.priority),
    `${item.status}`.toUpperCase(),
  );
}

export function toAdaptiveRewardRuleEntryViews(items: AdaptiveRewardRuleEntry[]): AdaptiveRewardRuleEntryView[] {
  const views: AdaptiveRewardRuleEntryView[] = [];
  for (const item of items) {
    views.push(toAdaptiveRewardRuleEntryView(item));
  }
  return views;
}

export function sumAdaptiveRewardRuleEntryView(view: AdaptiveRewardRuleEntryView): number {
  const parsedFloorValue = Number(view.floorValue);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValue} is not a number`);
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  return parsedFloorValue + parsedAttempts + parsedPriority;
}
