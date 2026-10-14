import * as text from "../../../../kit/text.js";
import { DefaultMentionMapping } from "./default-mention-mapping.js";

/** How screens and exports show a default mention mapping. */
export class DefaultMentionMappingView {
  code: string;
  label: string;
  ownerId: string;
  durationMinutesText: string;
  maximum: string;
  budget: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    ownerId: string,
    durationMinutesText: string,
    maximum: string,
    budget: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.ownerId = ownerId;
    this.durationMinutesText = durationMinutesText;
    this.maximum = maximum;
    this.budget = budget;
    this.statusLabel = statusLabel;
  }
}

export function toDefaultMentionMappingView(item: DefaultMentionMapping): DefaultMentionMappingView {
  return new DefaultMentionMappingView(
    text.truncate(item.code, 64),
    item.label,
    item.ownerId,
    String(item.durationMinutes),
    item.maximum.toFixed(2),
    item.budget.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toDefaultMentionMappingViews(items: DefaultMentionMapping[]): DefaultMentionMappingView[] {
  const views: DefaultMentionMappingView[] = [];
  for (const item of items) {
    views.push(toDefaultMentionMappingView(item));
  }
  return views;
}

export function sumDefaultMentionMappingView(view: DefaultMentionMappingView): number {
  const parsedDurationMinutes = Number(view.durationMinutesText);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutesText} is not a number`);
  const parsedMaximum = Number(view.maximum);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximum} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  return parsedDurationMinutes + parsedMaximum + parsedBudget;
}
