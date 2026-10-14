import * as text from "../../../../kit/text.js";
import { EnrollmentClaim } from "./enrollment-claim.js";

/** How screens and exports show a enrollment claim. */
export class EnrollmentClaimView {
  code: string;
  name: string;
  limit: string;
  threshold: string;
  cohort: string;
  startsAt: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    limit: string,
    threshold: string,
    cohort: string,
    startsAt: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.limit = limit;
    this.threshold = threshold;
    this.cohort = cohort;
    this.startsAt = startsAt;
    this.statusLabel = statusLabel;
  }
}

export function toEnrollmentClaimView(item: EnrollmentClaim): EnrollmentClaimView {
  return new EnrollmentClaimView(
    text.truncate(item.code, 64),
    item.name,
    String(item.limit),
    item.threshold.toFixed(2),
    item.cohort,
    String(item.startsAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toEnrollmentClaimViews(items: EnrollmentClaim[]): EnrollmentClaimView[] {
  const views: EnrollmentClaimView[] = [];
  for (const item of items) {
    views.push(toEnrollmentClaimView(item));
  }
  return views;
}

export function sumEnrollmentClaimView(view: EnrollmentClaimView): number {
  const parsedLimit = Number(view.limit);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limit} is not a number`);
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  return parsedLimit + parsedThreshold + parsedStartsAt;
}
