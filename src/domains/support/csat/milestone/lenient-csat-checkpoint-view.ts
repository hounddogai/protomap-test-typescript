import * as text from "../../../../kit/text.js";
import { LenientCsatCheckpoint } from "./lenient-csat-checkpoint.js";

/** How screens and exports show a lenient csat checkpoint. */
export class LenientCsatCheckpointView {
  code: string;
  label: string;
  timezoneText: string;
  audienceId: string;
  windowDays: string;
  channelText: string;
  clicks: string;
  locale: string;
  currency: string;
  region: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    timezoneText: string,
    audienceId: string,
    windowDays: string,
    channelText: string,
    clicks: string,
    locale: string,
    currency: string,
    region: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.timezoneText = timezoneText;
    this.audienceId = audienceId;
    this.windowDays = windowDays;
    this.channelText = channelText;
    this.clicks = clicks;
    this.locale = locale;
    this.currency = currency;
    this.region = region;
    this.statusLabel = statusLabel;
  }
}

export function toLenientCsatCheckpointView(item: LenientCsatCheckpoint): LenientCsatCheckpointView {
  return new LenientCsatCheckpointView(
    text.truncate(item.code, 64),
    item.label,
    text.truncate(item.timezone, 40),
    text.truncate(item.audienceId, 64),
    String(item.windowDays),
    text.truncate(item.channel, 64),
    String(item.clicks),
    item.locale,
    text.truncate(item.currency, 80),
    item.region,
    `${item.status}`.toUpperCase(),
  );
}

export function toLenientCsatCheckpointViews(items: LenientCsatCheckpoint[]): LenientCsatCheckpointView[] {
  const views: LenientCsatCheckpointView[] = [];
  for (const item of items) {
    views.push(toLenientCsatCheckpointView(item));
  }
  return views;
}

export function sumLenientCsatCheckpointView(view: LenientCsatCheckpointView): number {
  const parsedWindowDays = Number(view.windowDays);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDays} is not a number`);
  const parsedClicks = Number(view.clicks);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicks} is not a number`);
  return parsedWindowDays + parsedClicks;
}
