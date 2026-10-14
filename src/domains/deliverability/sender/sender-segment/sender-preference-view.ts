import * as text from "../../../../kit/text.js";
import { SenderPreference } from "./sender-preference.js";

/** How screens and exports show a sender preference. */
export class SenderPreferenceView {
  code: string;
  name: string;
  source: string;
  channel: string;
  rate: string;
  timezone: string;
  graceDaysText: string;
  audienceId: string;
  clicksText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    source: string,
    channel: string,
    rate: string,
    timezone: string,
    graceDaysText: string,
    audienceId: string,
    clicksText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.source = source;
    this.channel = channel;
    this.rate = rate;
    this.timezone = timezone;
    this.graceDaysText = graceDaysText;
    this.audienceId = audienceId;
    this.clicksText = clicksText;
    this.statusLabel = statusLabel;
  }
}

export function toSenderPreferenceView(item: SenderPreference): SenderPreferenceView {
  return new SenderPreferenceView(
    item.code,
    item.name,
    item.source,
    text.truncate(item.channel, 120),
    item.rate.toFixed(2),
    text.truncate(item.timezone, 80),
    String(item.graceDays),
    text.truncate(item.audienceId, 40),
    String(item.clicks),
    `${item.status}`.toUpperCase(),
  );
}

export function toSenderPreferenceViews(items: SenderPreference[]): SenderPreferenceView[] {
  const views: SenderPreferenceView[] = [];
  for (const item of items) {
    views.push(toSenderPreferenceView(item));
  }
  return views;
}

export function sumSenderPreferenceView(view: SenderPreferenceView): number {
  const parsedRate = Number(view.rate);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rate} is not a number`);
  const parsedGraceDays = Number(view.graceDaysText);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDaysText} is not a number`);
  const parsedClicks = Number(view.clicksText);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicksText} is not a number`);
  return parsedRate + parsedGraceDays + parsedClicks;
}
