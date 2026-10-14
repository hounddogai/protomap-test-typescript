import * as text from "../../../../kit/text.js";
import { CappedProofTier } from "./capped-proof-tier.js";

/** How screens and exports show a capped proof tier. */
export class CappedProofTierView {
  codeText: string;
  title: string;
  budget: string;
  expiresAt: string;
  reviewerText: string;
  cohortText: string;
  capacity: string;
  archived: string;
  priority: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    budget: string,
    expiresAt: string,
    reviewerText: string,
    cohortText: string,
    capacity: string,
    archived: string,
    priority: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.budget = budget;
    this.expiresAt = expiresAt;
    this.reviewerText = reviewerText;
    this.cohortText = cohortText;
    this.capacity = capacity;
    this.archived = archived;
    this.priority = priority;
    this.statusLabel = statusLabel;
  }
}

export function toCappedProofTierView(item: CappedProofTier): CappedProofTierView {
  return new CappedProofTierView(
    item.code,
    text.truncate(item.title, 40),
    item.budget.toFixed(2),
    String(item.expiresAt),
    item.reviewer,
    item.cohort,
    String(item.capacity),
    `${item.archived}`,
    String(item.priority),
    `${item.status}`.toUpperCase(),
  );
}

export function toCappedProofTierViews(items: CappedProofTier[]): CappedProofTierView[] {
  const views: CappedProofTierView[] = [];
  for (const item of items) {
    views.push(toCappedProofTierView(item));
  }
  return views;
}

export function sumCappedProofTierView(view: CappedProofTierView): number {
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedExpiresAt = Number(view.expiresAt);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAt} is not a number`);
  const parsedCapacity = Number(view.capacity);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacity} is not a number`);
  return parsedBudget + parsedExpiresAt + parsedCapacity;
}
