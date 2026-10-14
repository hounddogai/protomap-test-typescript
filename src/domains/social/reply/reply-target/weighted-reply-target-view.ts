import * as text from "../../../../kit/text.js";
import { WeightedReplyTarget } from "./weighted-reply-target.js";

/** How screens and exports show a weighted reply target. */
export class WeightedReplyTargetView {
  code: string;
  name: string;
  attempts: string;
  windowDaysText: string;
  title: string;
  checksum: string;
  budget: string;
  ownerId: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    attempts: string,
    windowDaysText: string,
    title: string,
    checksum: string,
    budget: string,
    ownerId: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.attempts = attempts;
    this.windowDaysText = windowDaysText;
    this.title = title;
    this.checksum = checksum;
    this.budget = budget;
    this.ownerId = ownerId;
    this.statusLabel = statusLabel;
  }
}

export function toWeightedReplyTargetView(item: WeightedReplyTarget): WeightedReplyTargetView {
  return new WeightedReplyTargetView(
    item.code,
    item.name,
    String(item.attempts),
    String(item.windowDays),
    item.title,
    text.truncate(item.checksum, 80),
    item.budget.toFixed(2),
    item.ownerId,
    `${item.status}`.toUpperCase(),
  );
}

export function toWeightedReplyTargetViews(items: WeightedReplyTarget[]): WeightedReplyTargetView[] {
  const views: WeightedReplyTargetView[] = [];
  for (const item of items) {
    views.push(toWeightedReplyTargetView(item));
  }
  return views;
}

export function sumWeightedReplyTargetView(view: WeightedReplyTargetView): number {
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  const parsedWindowDays = Number(view.windowDaysText);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDaysText} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  return parsedAttempts + parsedWindowDays + parsedBudget;
}
