import * as text from "../../../../kit/text.js";
import { RollingCreditSegment } from "./rolling-credit-segment.js";

/** How screens and exports show a rolling credit segment. */
export class RollingCreditSegmentView {
  code: string;
  title: string;
  budget: string;
  cohort: string;
  ceiling: string;
  expiresAt: string;
  source: string;
  weight: string;
  score: string;
  bid: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    budget: string,
    cohort: string,
    ceiling: string,
    expiresAt: string,
    source: string,
    weight: string,
    score: string,
    bid: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.budget = budget;
    this.cohort = cohort;
    this.ceiling = ceiling;
    this.expiresAt = expiresAt;
    this.source = source;
    this.weight = weight;
    this.score = score;
    this.bid = bid;
    this.statusLabel = statusLabel;
  }
}

export function toRollingCreditSegmentView(item: RollingCreditSegment): RollingCreditSegmentView {
  return new RollingCreditSegmentView(
    text.truncate(item.code, 120),
    item.title,
    item.budget.toFixed(2),
    item.cohort,
    item.ceiling.toFixed(2),
    String(item.expiresAt),
    item.source,
    item.weight.toFixed(2),
    item.score.toFixed(2),
    item.bid.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toRollingCreditSegmentViews(items: RollingCreditSegment[]): RollingCreditSegmentView[] {
  const views: RollingCreditSegmentView[] = [];
  for (const item of items) {
    views.push(toRollingCreditSegmentView(item));
  }
  return views;
}

export function sumRollingCreditSegmentView(view: RollingCreditSegmentView): number {
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedCeiling = Number(view.ceiling);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceiling} is not a number`);
  const parsedExpiresAt = Number(view.expiresAt);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAt} is not a number`);
  return parsedBudget + parsedCeiling + parsedExpiresAt;
}
