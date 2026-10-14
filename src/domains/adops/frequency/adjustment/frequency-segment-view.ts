import * as text from "../../../../kit/text.js";
import { FrequencySegment } from "./frequency-segment.js";

/** How screens and exports show a frequency segment. */
export class FrequencySegmentView {
  code: string;
  label: string;
  budget: string;
  threshold: string;
  cohort: string;
  frequencyCap: string;
  discount: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    budget: string,
    threshold: string,
    cohort: string,
    frequencyCap: string,
    discount: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.budget = budget;
    this.threshold = threshold;
    this.cohort = cohort;
    this.frequencyCap = frequencyCap;
    this.discount = discount;
    this.statusLabel = statusLabel;
  }
}

export function toFrequencySegmentView(item: FrequencySegment): FrequencySegmentView {
  return new FrequencySegmentView(
    item.code,
    text.truncate(item.label, 64),
    item.budget.toFixed(2),
    item.threshold.toFixed(2),
    item.cohort,
    String(item.frequencyCap),
    item.discount.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toFrequencySegmentViews(items: FrequencySegment[]): FrequencySegmentView[] {
  const views: FrequencySegmentView[] = [];
  for (const item of items) {
    views.push(toFrequencySegmentView(item));
  }
  return views;
}

export function sumFrequencySegmentView(view: FrequencySegmentView): number {
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  const parsedFrequencyCap = Number(view.frequencyCap);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCap} is not a number`);
  return parsedBudget + parsedThreshold + parsedFrequencyCap;
}
