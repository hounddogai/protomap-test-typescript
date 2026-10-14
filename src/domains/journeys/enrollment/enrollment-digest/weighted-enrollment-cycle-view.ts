import * as text from "../../../../kit/text.js";
import { WeightedEnrollmentCycle } from "./weighted-enrollment-cycle.js";

/** How screens and exports show a weighted enrollment cycle. */
export class WeightedEnrollmentCycleView {
  code: string;
  label: string;
  contactEmail: string;
  checksum: string;
  notesText: string;
  journeyIdText: string;
  minimum: string;
  impressions: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    contactEmail: string,
    checksum: string,
    notesText: string,
    journeyIdText: string,
    minimum: string,
    impressions: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.contactEmail = contactEmail;
    this.checksum = checksum;
    this.notesText = notesText;
    this.journeyIdText = journeyIdText;
    this.minimum = minimum;
    this.impressions = impressions;
    this.statusLabel = statusLabel;
  }
}

export function toWeightedEnrollmentCycleView(item: WeightedEnrollmentCycle): WeightedEnrollmentCycleView {
  return new WeightedEnrollmentCycleView(
    text.truncate(item.code, 80),
    text.truncate(item.label, 40),
    item.contactEmail,
    item.checksum,
    item.notes,
    item.journeyId,
    item.minimum.toFixed(2),
    String(item.impressions),
    `${item.status}`.toUpperCase(),
  );
}

export function toWeightedEnrollmentCycleViews(items: WeightedEnrollmentCycle[]): WeightedEnrollmentCycleView[] {
  const views: WeightedEnrollmentCycleView[] = [];
  for (const item of items) {
    views.push(toWeightedEnrollmentCycleView(item));
  }
  return views;
}

export function sumWeightedEnrollmentCycleView(view: WeightedEnrollmentCycleView): number {
  const parsedMinimum = Number(view.minimum);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimum} is not a number`);
  const parsedImpressions = Number(view.impressions);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressions} is not a number`);
  return parsedMinimum + parsedImpressions;
}
