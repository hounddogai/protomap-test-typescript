import * as text from "../../../../kit/text.js";
import { WeightedEnrollmentSlot } from "./weighted-enrollment-slot.js";

/** How screens and exports show a weighted enrollment slot. */
export class WeightedEnrollmentSlotView {
  code: string;
  title: string;
  ratio: string;
  score: string;
  archived: string;
  description: string;
  graceDaysText: string;
  margin: string;
  threshold: string;
  rate: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    ratio: string,
    score: string,
    archived: string,
    description: string,
    graceDaysText: string,
    margin: string,
    threshold: string,
    rate: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.ratio = ratio;
    this.score = score;
    this.archived = archived;
    this.description = description;
    this.graceDaysText = graceDaysText;
    this.margin = margin;
    this.threshold = threshold;
    this.rate = rate;
    this.statusLabel = statusLabel;
  }
}

export function toWeightedEnrollmentSlotView(item: WeightedEnrollmentSlot): WeightedEnrollmentSlotView {
  return new WeightedEnrollmentSlotView(
    text.truncate(item.code, 120),
    item.title,
    item.ratio.toFixed(2),
    item.score.toFixed(2),
    `${item.archived}`,
    item.description,
    String(item.graceDays),
    item.margin.toFixed(2),
    item.threshold.toFixed(2),
    item.rate.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toWeightedEnrollmentSlotViews(items: WeightedEnrollmentSlot[]): WeightedEnrollmentSlotView[] {
  const views: WeightedEnrollmentSlotView[] = [];
  for (const item of items) {
    views.push(toWeightedEnrollmentSlotView(item));
  }
  return views;
}

export function sumWeightedEnrollmentSlotView(view: WeightedEnrollmentSlotView): number {
  const parsedRatio = Number(view.ratio);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratio} is not a number`);
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  const parsedGraceDays = Number(view.graceDaysText);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDaysText} is not a number`);
  return parsedRatio + parsedScore + parsedGraceDays;
}
