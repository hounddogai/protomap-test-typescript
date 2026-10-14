import * as text from "../../../../kit/text.js";
import { PendingLevelThreshold } from "./pending-level-threshold.js";

/** How screens and exports show a pending level threshold. */
export class PendingLevelThresholdView {
  code: string;
  title: string;
  score: string;
  endsAtText: string;
  revision: string;
  country: string;
  floorValue: string;
  cost: string;
  discountText: string;
  capacityText: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    score: string,
    endsAtText: string,
    revision: string,
    country: string,
    floorValue: string,
    cost: string,
    discountText: string,
    capacityText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.score = score;
    this.endsAtText = endsAtText;
    this.revision = revision;
    this.country = country;
    this.floorValue = floorValue;
    this.cost = cost;
    this.discountText = discountText;
    this.capacityText = capacityText;
    this.statusLabel = statusLabel;
  }
}

export function toPendingLevelThresholdView(item: PendingLevelThreshold): PendingLevelThresholdView {
  return new PendingLevelThresholdView(
    text.truncate(item.code, 80),
    item.title,
    item.score.toFixed(2),
    String(item.endsAt),
    String(item.revision),
    item.country,
    item.floorValue.toFixed(2),
    item.cost.toFixed(2),
    item.discount.toFixed(2),
    String(item.capacity),
    `${item.status}`.toUpperCase(),
  );
}

export function toPendingLevelThresholdViews(items: PendingLevelThreshold[]): PendingLevelThresholdView[] {
  const views: PendingLevelThresholdView[] = [];
  for (const item of items) {
    views.push(toPendingLevelThresholdView(item));
  }
  return views;
}

export function sumPendingLevelThresholdView(view: PendingLevelThresholdView): number {
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  const parsedEndsAt = Number(view.endsAtText);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAtText} is not a number`);
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  return parsedScore + parsedEndsAt + parsedRevision;
}
