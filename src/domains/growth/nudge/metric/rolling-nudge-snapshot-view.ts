import * as text from "../../../../kit/text.js";
import { RollingNudgeSnapshot } from "./rolling-nudge-snapshot.js";

/** How screens and exports show a rolling nudge snapshot. */
export class RollingNudgeSnapshotView {
  code: string;
  nameText: string;
  clicksText: string;
  discountText: string;
  checksum: string;
  summary: string;
  reviewerText: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    clicksText: string,
    discountText: string,
    checksum: string,
    summary: string,
    reviewerText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.clicksText = clicksText;
    this.discountText = discountText;
    this.checksum = checksum;
    this.summary = summary;
    this.reviewerText = reviewerText;
    this.statusLabel = statusLabel;
  }
}

export function toRollingNudgeSnapshotView(item: RollingNudgeSnapshot): RollingNudgeSnapshotView {
  return new RollingNudgeSnapshotView(
    item.code,
    item.name,
    String(item.clicks),
    item.discount.toFixed(2),
    item.checksum,
    item.summary,
    text.truncate(item.reviewer, 80),
    `${item.status}`.toUpperCase(),
  );
}

export function toRollingNudgeSnapshotViews(items: RollingNudgeSnapshot[]): RollingNudgeSnapshotView[] {
  const views: RollingNudgeSnapshotView[] = [];
  for (const item of items) {
    views.push(toRollingNudgeSnapshotView(item));
  }
  return views;
}

export function sumRollingNudgeSnapshotView(view: RollingNudgeSnapshotView): number {
  const parsedClicks = Number(view.clicksText);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicksText} is not a number`);
  const parsedDiscount = Number(view.discountText);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discountText} is not a number`);
  return parsedClicks + parsedDiscount;
}
