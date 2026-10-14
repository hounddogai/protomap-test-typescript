import * as text from "../../../../kit/text.js";
import { BatchedPlacementPreference } from "./batched-placement-preference.js";

/** How screens and exports show a batched placement preference. */
export class BatchedPlacementPreferenceView {
  codeText: string;
  name: string;
  segmentText: string;
  minimum: string;
  rateText: string;
  openRate: string;
  audienceId: string;
  contactEmailText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    segmentText: string,
    minimum: string,
    rateText: string,
    openRate: string,
    audienceId: string,
    contactEmailText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.segmentText = segmentText;
    this.minimum = minimum;
    this.rateText = rateText;
    this.openRate = openRate;
    this.audienceId = audienceId;
    this.contactEmailText = contactEmailText;
    this.statusLabel = statusLabel;
  }
}

export function toBatchedPlacementPreferenceView(item: BatchedPlacementPreference): BatchedPlacementPreferenceView {
  return new BatchedPlacementPreferenceView(
    text.truncate(item.code, 120),
    text.truncate(item.name, 40),
    item.segment,
    item.minimum.toFixed(2),
    item.rate.toFixed(2),
    item.openRate.toFixed(2),
    item.audienceId,
    item.contactEmail,
    `${item.status}`.toUpperCase(),
  );
}

export function toBatchedPlacementPreferenceViews(items: BatchedPlacementPreference[]): BatchedPlacementPreferenceView[] {
  const views: BatchedPlacementPreferenceView[] = [];
  for (const item of items) {
    views.push(toBatchedPlacementPreferenceView(item));
  }
  return views;
}

export function sumBatchedPlacementPreferenceView(view: BatchedPlacementPreferenceView): number {
  const parsedMinimum = Number(view.minimum);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimum} is not a number`);
  const parsedRate = Number(view.rateText);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rateText} is not a number`);
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  return parsedMinimum + parsedRate + parsedOpenRate;
}
