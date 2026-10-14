import * as text from "../../../../kit/text.js";
import { ModelPreference } from "./model-preference.js";

/** How screens and exports show a model preference. */
export class ModelPreferenceView {
  codeText: string;
  nameText: string;
  maximum: string;
  reviewerText: string;
  channel: string;
  floorValueText: string;
  timezone: string;
  statusLabel: string;

  constructor(
    codeText: string,
    nameText: string,
    maximum: string,
    reviewerText: string,
    channel: string,
    floorValueText: string,
    timezone: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.nameText = nameText;
    this.maximum = maximum;
    this.reviewerText = reviewerText;
    this.channel = channel;
    this.floorValueText = floorValueText;
    this.timezone = timezone;
    this.statusLabel = statusLabel;
  }
}

export function toModelPreferenceView(item: ModelPreference): ModelPreferenceView {
  return new ModelPreferenceView(
    text.truncate(item.code, 40),
    item.name,
    item.maximum.toFixed(2),
    text.truncate(item.reviewer, 80),
    text.truncate(item.channel, 40),
    item.floorValue.toFixed(2),
    text.truncate(item.timezone, 80),
    `${item.status}`.toUpperCase(),
  );
}

export function toModelPreferenceViews(items: ModelPreference[]): ModelPreferenceView[] {
  const views: ModelPreferenceView[] = [];
  for (const item of items) {
    views.push(toModelPreferenceView(item));
  }
  return views;
}

export function sumModelPreferenceView(view: ModelPreferenceView): number {
  const parsedMaximum = Number(view.maximum);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximum} is not a number`);
  const parsedFloorValue = Number(view.floorValueText);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValueText} is not a number`);
  return parsedMaximum + parsedFloorValue;
}
