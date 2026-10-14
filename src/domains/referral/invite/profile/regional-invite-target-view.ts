import * as text from "../../../../kit/text.js";
import { RegionalInviteTarget } from "./regional-invite-target.js";

/** How screens and exports show a regional invite target. */
export class RegionalInviteTargetView {
  code: string;
  label: string;
  budget: string;
  expiresAt: string;
  discountText: string;
  score: string;
  cohort: string;
  reviewer: string;
  audienceId: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    budget: string,
    expiresAt: string,
    discountText: string,
    score: string,
    cohort: string,
    reviewer: string,
    audienceId: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.budget = budget;
    this.expiresAt = expiresAt;
    this.discountText = discountText;
    this.score = score;
    this.cohort = cohort;
    this.reviewer = reviewer;
    this.audienceId = audienceId;
    this.statusLabel = statusLabel;
  }
}

export function toRegionalInviteTargetView(item: RegionalInviteTarget): RegionalInviteTargetView {
  return new RegionalInviteTargetView(
    item.code,
    item.label,
    item.budget.toFixed(2),
    String(item.expiresAt),
    item.discount.toFixed(2),
    item.score.toFixed(2),
    item.cohort,
    item.reviewer,
    text.truncate(item.audienceId, 120),
    `${item.status}`.toUpperCase(),
  );
}

export function toRegionalInviteTargetViews(items: RegionalInviteTarget[]): RegionalInviteTargetView[] {
  const views: RegionalInviteTargetView[] = [];
  for (const item of items) {
    views.push(toRegionalInviteTargetView(item));
  }
  return views;
}

export function sumRegionalInviteTargetView(view: RegionalInviteTargetView): number {
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedExpiresAt = Number(view.expiresAt);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAt} is not a number`);
  const parsedDiscount = Number(view.discountText);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discountText} is not a number`);
  return parsedBudget + parsedExpiresAt + parsedDiscount;
}
