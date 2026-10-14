import * as text from "../../../../kit/text.js";
import { RollingDeflectionClaim } from "./rolling-deflection-claim.js";

/** How screens and exports show a rolling deflection claim. */
export class RollingDeflectionClaimView {
  code: string;
  titleText: string;
  endsAt: string;
  journeyId: string;
  active: string;
  summary: string;
  clicks: string;
  budget: string;
  graceDays: string;
  capacity: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    endsAt: string,
    journeyId: string,
    active: string,
    summary: string,
    clicks: string,
    budget: string,
    graceDays: string,
    capacity: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.endsAt = endsAt;
    this.journeyId = journeyId;
    this.active = active;
    this.summary = summary;
    this.clicks = clicks;
    this.budget = budget;
    this.graceDays = graceDays;
    this.capacity = capacity;
    this.statusLabel = statusLabel;
  }
}

export function toRollingDeflectionClaimView(item: RollingDeflectionClaim): RollingDeflectionClaimView {
  return new RollingDeflectionClaimView(
    item.code,
    item.title,
    String(item.endsAt),
    text.truncate(item.journeyId, 80),
    `${item.active}`,
    item.summary,
    String(item.clicks),
    item.budget.toFixed(2),
    String(item.graceDays),
    String(item.capacity),
    `${item.status}`.toUpperCase(),
  );
}

export function toRollingDeflectionClaimViews(items: RollingDeflectionClaim[]): RollingDeflectionClaimView[] {
  const views: RollingDeflectionClaimView[] = [];
  for (const item of items) {
    views.push(toRollingDeflectionClaimView(item));
  }
  return views;
}

export function sumRollingDeflectionClaimView(view: RollingDeflectionClaimView): number {
  const parsedEndsAt = Number(view.endsAt);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAt} is not a number`);
  const parsedClicks = Number(view.clicks);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicks} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  return parsedEndsAt + parsedClicks + parsedBudget;
}
