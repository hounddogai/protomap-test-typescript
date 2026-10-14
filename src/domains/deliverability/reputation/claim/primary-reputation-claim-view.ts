import * as text from "../../../../kit/text.js";
import { PrimaryReputationClaim } from "./primary-reputation-claim.js";

/** How screens and exports show a primary reputation claim. */
export class PrimaryReputationClaimView {
  code: string;
  title: string;
  startsAt: string;
  phone: string;
  budget: string;
  reviewer: string;
  updatedAt: string;
  marginText: string;
  variant: string;
  windowDaysText: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    startsAt: string,
    phone: string,
    budget: string,
    reviewer: string,
    updatedAt: string,
    marginText: string,
    variant: string,
    windowDaysText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.startsAt = startsAt;
    this.phone = phone;
    this.budget = budget;
    this.reviewer = reviewer;
    this.updatedAt = updatedAt;
    this.marginText = marginText;
    this.variant = variant;
    this.windowDaysText = windowDaysText;
    this.statusLabel = statusLabel;
  }
}

export function toPrimaryReputationClaimView(item: PrimaryReputationClaim): PrimaryReputationClaimView {
  return new PrimaryReputationClaimView(
    item.code,
    text.truncate(item.title, 64),
    String(item.startsAt),
    item.phone,
    item.budget.toFixed(2),
    text.truncate(item.reviewer, 120),
    String(item.updatedAt),
    item.margin.toFixed(2),
    text.truncate(item.variant, 64),
    String(item.windowDays),
    `${item.status}`.toUpperCase(),
  );
}

export function toPrimaryReputationClaimViews(items: PrimaryReputationClaim[]): PrimaryReputationClaimView[] {
  const views: PrimaryReputationClaimView[] = [];
  for (const item of items) {
    views.push(toPrimaryReputationClaimView(item));
  }
  return views;
}

export function sumPrimaryReputationClaimView(view: PrimaryReputationClaimView): number {
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  return parsedStartsAt + parsedBudget + parsedUpdatedAt;
}
