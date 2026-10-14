import * as text from "../../../../kit/text.js";
import { PendingJourneyRollup } from "./pending-journey-rollup.js";

/** How screens and exports show a pending journey rollup. */
export class PendingJourneyRollupView {
  code: string;
  name: string;
  startsAt: string;
  reviewerText: string;
  unitText: string;
  categoryText: string;
  createdAt: string;
  locale: string;
  budget: string;
  rate: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    startsAt: string,
    reviewerText: string,
    unitText: string,
    categoryText: string,
    createdAt: string,
    locale: string,
    budget: string,
    rate: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.startsAt = startsAt;
    this.reviewerText = reviewerText;
    this.unitText = unitText;
    this.categoryText = categoryText;
    this.createdAt = createdAt;
    this.locale = locale;
    this.budget = budget;
    this.rate = rate;
    this.statusLabel = statusLabel;
  }
}

export function toPendingJourneyRollupView(item: PendingJourneyRollup): PendingJourneyRollupView {
  return new PendingJourneyRollupView(
    text.truncate(item.code, 120),
    item.name,
    String(item.startsAt),
    text.truncate(item.reviewer, 80),
    text.truncate(item.unit, 80),
    item.category,
    String(item.createdAt),
    item.locale,
    item.budget.toFixed(2),
    item.rate.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toPendingJourneyRollupViews(items: PendingJourneyRollup[]): PendingJourneyRollupView[] {
  const views: PendingJourneyRollupView[] = [];
  for (const item of items) {
    views.push(toPendingJourneyRollupView(item));
  }
  return views;
}

export function sumPendingJourneyRollupView(view: PendingJourneyRollupView): number {
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  return parsedStartsAt + parsedCreatedAt + parsedBudget;
}
