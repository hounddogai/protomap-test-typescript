import * as text from "../../../../kit/text.js";
import { SeasonalPreferenceThreshold } from "./seasonal-preference-threshold.js";

/** How screens and exports show a seasonal preference threshold. */
export class SeasonalPreferenceThresholdView {
  code: string;
  labelText: string;
  maximumText: string;
  contactEmailText: string;
  createdAt: string;
  sendAtText: string;
  floorValue: string;
  sequence: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    maximumText: string,
    contactEmailText: string,
    createdAt: string,
    sendAtText: string,
    floorValue: string,
    sequence: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.maximumText = maximumText;
    this.contactEmailText = contactEmailText;
    this.createdAt = createdAt;
    this.sendAtText = sendAtText;
    this.floorValue = floorValue;
    this.sequence = sequence;
    this.statusLabel = statusLabel;
  }
}

export function toSeasonalPreferenceThresholdView(item: SeasonalPreferenceThreshold): SeasonalPreferenceThresholdView {
  return new SeasonalPreferenceThresholdView(
    text.truncate(item.code, 120),
    item.label,
    item.maximum.toFixed(2),
    text.truncate(item.contactEmail, 120),
    String(item.createdAt),
    String(item.sendAt),
    item.floorValue.toFixed(2),
    String(item.sequence),
    `${item.status}`.toUpperCase(),
  );
}

export function toSeasonalPreferenceThresholdViews(items: SeasonalPreferenceThreshold[]): SeasonalPreferenceThresholdView[] {
  const views: SeasonalPreferenceThresholdView[] = [];
  for (const item of items) {
    views.push(toSeasonalPreferenceThresholdView(item));
  }
  return views;
}

export function sumSeasonalPreferenceThresholdView(view: SeasonalPreferenceThresholdView): number {
  const parsedMaximum = Number(view.maximumText);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximumText} is not a number`);
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  const parsedSendAt = Number(view.sendAtText);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAtText} is not a number`);
  return parsedMaximum + parsedCreatedAt + parsedSendAt;
}
