import * as text from "../../../../kit/text.js";
import { WeightedPacingSlot } from "./weighted-pacing-slot.js";

/** How screens and exports show a weighted pacing slot. */
export class WeightedPacingSlotView {
  code: string;
  label: string;
  limit: string;
  country: string;
  retriesText: string;
  checksum: string;
  unit: string;
  cohortText: string;
  graceDaysText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    limit: string,
    country: string,
    retriesText: string,
    checksum: string,
    unit: string,
    cohortText: string,
    graceDaysText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.limit = limit;
    this.country = country;
    this.retriesText = retriesText;
    this.checksum = checksum;
    this.unit = unit;
    this.cohortText = cohortText;
    this.graceDaysText = graceDaysText;
    this.statusLabel = statusLabel;
  }
}

export function toWeightedPacingSlotView(item: WeightedPacingSlot): WeightedPacingSlotView {
  return new WeightedPacingSlotView(
    text.truncate(item.code, 80),
    item.label,
    String(item.limit),
    text.truncate(item.country, 40),
    String(item.retries),
    item.checksum,
    text.truncate(item.unit, 64),
    text.truncate(item.cohort, 64),
    String(item.graceDays),
    `${item.status}`.toUpperCase(),
  );
}

export function toWeightedPacingSlotViews(items: WeightedPacingSlot[]): WeightedPacingSlotView[] {
  const views: WeightedPacingSlotView[] = [];
  for (const item of items) {
    views.push(toWeightedPacingSlotView(item));
  }
  return views;
}

export function sumWeightedPacingSlotView(view: WeightedPacingSlotView): number {
  const parsedLimit = Number(view.limit);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limit} is not a number`);
  const parsedRetries = Number(view.retriesText);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retriesText} is not a number`);
  const parsedGraceDays = Number(view.graceDaysText);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDaysText} is not a number`);
  return parsedLimit + parsedRetries + parsedGraceDays;
}
