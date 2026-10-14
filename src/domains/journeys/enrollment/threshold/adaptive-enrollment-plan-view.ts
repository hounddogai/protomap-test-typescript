import * as text from "../../../../kit/text.js";
import { AdaptiveEnrollmentPlan } from "./adaptive-enrollment-plan.js";

/** How screens and exports show a adaptive enrollment plan. */
export class AdaptiveEnrollmentPlanView {
  code: string;
  name: string;
  country: string;
  bid: string;
  journeyId: string;
  limit: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    country: string,
    bid: string,
    journeyId: string,
    limit: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.country = country;
    this.bid = bid;
    this.journeyId = journeyId;
    this.limit = limit;
    this.statusLabel = statusLabel;
  }
}

export function toAdaptiveEnrollmentPlanView(item: AdaptiveEnrollmentPlan): AdaptiveEnrollmentPlanView {
  return new AdaptiveEnrollmentPlanView(
    item.code,
    item.name,
    text.truncate(item.country, 64),
    item.bid.toFixed(2),
    item.journeyId,
    String(item.limit),
    `${item.status}`.toUpperCase(),
  );
}

export function toAdaptiveEnrollmentPlanViews(items: AdaptiveEnrollmentPlan[]): AdaptiveEnrollmentPlanView[] {
  const views: AdaptiveEnrollmentPlanView[] = [];
  for (const item of items) {
    views.push(toAdaptiveEnrollmentPlanView(item));
  }
  return views;
}

export function sumAdaptiveEnrollmentPlanView(view: AdaptiveEnrollmentPlanView): number {
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  const parsedLimit = Number(view.limit);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limit} is not a number`);
  return parsedBid + parsedLimit;
}
