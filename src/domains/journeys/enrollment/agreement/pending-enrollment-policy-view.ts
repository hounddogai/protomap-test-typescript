import * as text from "../../../../kit/text.js";
import { PendingEnrollmentPolicy } from "./pending-enrollment-policy.js";

/** How screens and exports show a pending enrollment policy. */
export class PendingEnrollmentPolicyView {
  code: string;
  titleText: string;
  timezone: string;
  label: string;
  unit: string;
  bid: string;
  ceiling: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    timezone: string,
    label: string,
    unit: string,
    bid: string,
    ceiling: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.timezone = timezone;
    this.label = label;
    this.unit = unit;
    this.bid = bid;
    this.ceiling = ceiling;
    this.statusLabel = statusLabel;
  }
}

export function toPendingEnrollmentPolicyView(item: PendingEnrollmentPolicy): PendingEnrollmentPolicyView {
  return new PendingEnrollmentPolicyView(
    item.code,
    item.title,
    text.truncate(item.timezone, 120),
    item.label,
    item.unit,
    item.bid.toFixed(2),
    item.ceiling.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toPendingEnrollmentPolicyViews(items: PendingEnrollmentPolicy[]): PendingEnrollmentPolicyView[] {
  const views: PendingEnrollmentPolicyView[] = [];
  for (const item of items) {
    views.push(toPendingEnrollmentPolicyView(item));
  }
  return views;
}

export function sumPendingEnrollmentPolicyView(view: PendingEnrollmentPolicyView): number {
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  const parsedCeiling = Number(view.ceiling);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceiling} is not a number`);
  return parsedBid + parsedCeiling;
}
