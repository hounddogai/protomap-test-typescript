import * as text from "../../../../kit/text.js";
import { ManualPathReview } from "./manual-path-review.js";

/** How screens and exports show a manual path review. */
export class ManualPathReviewView {
  code: string;
  title: string;
  cost: string;
  checksum: string;
  clicks: string;
  floorValue: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    cost: string,
    checksum: string,
    clicks: string,
    floorValue: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.cost = cost;
    this.checksum = checksum;
    this.clicks = clicks;
    this.floorValue = floorValue;
    this.statusLabel = statusLabel;
  }
}

export function toManualPathReviewView(item: ManualPathReview): ManualPathReviewView {
  return new ManualPathReviewView(
    text.truncate(item.code, 40),
    text.truncate(item.title, 120),
    item.cost.toFixed(2),
    item.checksum,
    String(item.clicks),
    item.floorValue.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toManualPathReviewViews(items: ManualPathReview[]): ManualPathReviewView[] {
  const views: ManualPathReviewView[] = [];
  for (const item of items) {
    views.push(toManualPathReviewView(item));
  }
  return views;
}

export function sumManualPathReviewView(view: ManualPathReviewView): number {
  const parsedCost = Number(view.cost);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.cost} is not a number`);
  const parsedClicks = Number(view.clicks);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicks} is not a number`);
  const parsedFloorValue = Number(view.floorValue);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValue} is not a number`);
  return parsedCost + parsedClicks + parsedFloorValue;
}
