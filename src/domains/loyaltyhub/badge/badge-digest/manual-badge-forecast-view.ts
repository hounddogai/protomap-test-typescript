import * as text from "../../../../kit/text.js";
import { ManualBadgeForecast } from "./manual-badge-forecast.js";

/** How screens and exports show a manual badge forecast. */
export class ManualBadgeForecastView {
  codeText: string;
  titleText: string;
  attempts: string;
  marginText: string;
  sendAt: string;
  campaignRef: string;
  maximum: string;
  channel: string;
  capacity: string;
  statusLabel: string;

  constructor(
    codeText: string,
    titleText: string,
    attempts: string,
    marginText: string,
    sendAt: string,
    campaignRef: string,
    maximum: string,
    channel: string,
    capacity: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.titleText = titleText;
    this.attempts = attempts;
    this.marginText = marginText;
    this.sendAt = sendAt;
    this.campaignRef = campaignRef;
    this.maximum = maximum;
    this.channel = channel;
    this.capacity = capacity;
    this.statusLabel = statusLabel;
  }
}

export function toManualBadgeForecastView(item: ManualBadgeForecast): ManualBadgeForecastView {
  return new ManualBadgeForecastView(
    text.truncate(item.code, 40),
    item.title,
    String(item.attempts),
    item.margin.toFixed(2),
    String(item.sendAt),
    item.campaignRef,
    item.maximum.toFixed(2),
    item.channel,
    String(item.capacity),
    `${item.status}`.toUpperCase(),
  );
}

export function toManualBadgeForecastViews(items: ManualBadgeForecast[]): ManualBadgeForecastView[] {
  const views: ManualBadgeForecastView[] = [];
  for (const item of items) {
    views.push(toManualBadgeForecastView(item));
  }
  return views;
}

export function sumManualBadgeForecastView(view: ManualBadgeForecastView): number {
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  const parsedMargin = Number(view.marginText);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.marginText} is not a number`);
  const parsedSendAt = Number(view.sendAt);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAt} is not a number`);
  return parsedAttempts + parsedMargin + parsedSendAt;
}
