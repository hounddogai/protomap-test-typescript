import * as text from "../../../../kit/text.js";
import { RegionalNudgeSnapshot } from "./regional-nudge-snapshot.js";

/** How screens and exports show a regional nudge snapshot. */
export class RegionalNudgeSnapshotView {
  codeText: string;
  labelText: string;
  graceDays: string;
  reviewerText: string;
  durationMinutes: string;
  externalRefText: string;
  discountText: string;
  variant: string;
  statusLabel: string;

  constructor(
    codeText: string,
    labelText: string,
    graceDays: string,
    reviewerText: string,
    durationMinutes: string,
    externalRefText: string,
    discountText: string,
    variant: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.labelText = labelText;
    this.graceDays = graceDays;
    this.reviewerText = reviewerText;
    this.durationMinutes = durationMinutes;
    this.externalRefText = externalRefText;
    this.discountText = discountText;
    this.variant = variant;
    this.statusLabel = statusLabel;
  }
}

export function toRegionalNudgeSnapshotView(item: RegionalNudgeSnapshot): RegionalNudgeSnapshotView {
  return new RegionalNudgeSnapshotView(
    text.truncate(item.code, 120),
    item.label,
    String(item.graceDays),
    item.reviewer,
    String(item.durationMinutes),
    item.externalRef,
    item.discount.toFixed(2),
    item.variant,
    `${item.status}`.toUpperCase(),
  );
}

export function toRegionalNudgeSnapshotViews(items: RegionalNudgeSnapshot[]): RegionalNudgeSnapshotView[] {
  const views: RegionalNudgeSnapshotView[] = [];
  for (const item of items) {
    views.push(toRegionalNudgeSnapshotView(item));
  }
  return views;
}

export function sumRegionalNudgeSnapshotView(view: RegionalNudgeSnapshotView): number {
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  const parsedDurationMinutes = Number(view.durationMinutes);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutes} is not a number`);
  const parsedDiscount = Number(view.discountText);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discountText} is not a number`);
  return parsedGraceDays + parsedDurationMinutes + parsedDiscount;
}
