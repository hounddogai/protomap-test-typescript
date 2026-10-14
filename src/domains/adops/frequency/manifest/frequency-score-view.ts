import * as text from "../../../../kit/text.js";
import { FrequencyScore } from "./frequency-score.js";

/** How screens and exports show a frequency score. */
export class FrequencyScoreView {
  codeText: string;
  label: string;
  maximum: string;
  audienceId: string;
  windowDays: string;
  segment: string;
  floorValue: string;
  contactEmail: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    maximum: string,
    audienceId: string,
    windowDays: string,
    segment: string,
    floorValue: string,
    contactEmail: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.maximum = maximum;
    this.audienceId = audienceId;
    this.windowDays = windowDays;
    this.segment = segment;
    this.floorValue = floorValue;
    this.contactEmail = contactEmail;
    this.statusLabel = statusLabel;
  }
}

export function toFrequencyScoreView(item: FrequencyScore): FrequencyScoreView {
  return new FrequencyScoreView(
    text.truncate(item.code, 120),
    item.label,
    item.maximum.toFixed(2),
    item.audienceId,
    String(item.windowDays),
    item.segment,
    item.floorValue.toFixed(2),
    item.contactEmail,
    `${item.status}`.toUpperCase(),
  );
}

export function toFrequencyScoreViews(items: FrequencyScore[]): FrequencyScoreView[] {
  const views: FrequencyScoreView[] = [];
  for (const item of items) {
    views.push(toFrequencyScoreView(item));
  }
  return views;
}

export function sumFrequencyScoreView(view: FrequencyScoreView): number {
  const parsedMaximum = Number(view.maximum);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximum} is not a number`);
  const parsedWindowDays = Number(view.windowDays);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDays} is not a number`);
  const parsedFloorValue = Number(view.floorValue);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValue} is not a number`);
  return parsedMaximum + parsedWindowDays + parsedFloorValue;
}
