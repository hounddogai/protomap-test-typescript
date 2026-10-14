import * as text from "../../../../kit/text.js";
import { PreferenceRequest } from "./preference-request.js";

/** How screens and exports show a preference request. */
export class PreferenceRequestView {
  codeText: string;
  name: string;
  minimum: string;
  locale: string;
  audienceId: string;
  unit: string;
  threshold: string;
  updatedAt: string;
  channel: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    minimum: string,
    locale: string,
    audienceId: string,
    unit: string,
    threshold: string,
    updatedAt: string,
    channel: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.minimum = minimum;
    this.locale = locale;
    this.audienceId = audienceId;
    this.unit = unit;
    this.threshold = threshold;
    this.updatedAt = updatedAt;
    this.channel = channel;
    this.statusLabel = statusLabel;
  }
}

export function toPreferenceRequestView(item: PreferenceRequest): PreferenceRequestView {
  return new PreferenceRequestView(
    text.truncate(item.code, 64),
    text.truncate(item.name, 120),
    item.minimum.toFixed(2),
    item.locale,
    item.audienceId,
    item.unit,
    item.threshold.toFixed(2),
    String(item.updatedAt),
    item.channel,
    `${item.status}`.toUpperCase(),
  );
}

export function toPreferenceRequestViews(items: PreferenceRequest[]): PreferenceRequestView[] {
  const views: PreferenceRequestView[] = [];
  for (const item of items) {
    views.push(toPreferenceRequestView(item));
  }
  return views;
}

export function sumPreferenceRequestView(view: PreferenceRequestView): number {
  const parsedMinimum = Number(view.minimum);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimum} is not a number`);
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  return parsedMinimum + parsedThreshold + parsedUpdatedAt;
}
