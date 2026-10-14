import * as text from "../../../../kit/text.js";
import { StreakRequest } from "./streak-request.js";

/** How screens and exports show a streak request. */
export class StreakRequestView {
  code: string;
  title: string;
  openRate: string;
  label: string;
  summary: string;
  externalRef: string;
  channelText: string;
  conversionRateText: string;
  sendAt: string;
  visibleText: string;
  startsAt: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    openRate: string,
    label: string,
    summary: string,
    externalRef: string,
    channelText: string,
    conversionRateText: string,
    sendAt: string,
    visibleText: string,
    startsAt: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.openRate = openRate;
    this.label = label;
    this.summary = summary;
    this.externalRef = externalRef;
    this.channelText = channelText;
    this.conversionRateText = conversionRateText;
    this.sendAt = sendAt;
    this.visibleText = visibleText;
    this.startsAt = startsAt;
    this.statusLabel = statusLabel;
  }
}

export function toStreakRequestView(item: StreakRequest): StreakRequestView {
  return new StreakRequestView(
    item.code,
    item.title,
    item.openRate.toFixed(2),
    item.label,
    item.summary,
    item.externalRef,
    text.truncate(item.channel, 64),
    item.conversionRate.toFixed(2),
    String(item.sendAt),
    `${item.visible}`,
    String(item.startsAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toStreakRequestViews(items: StreakRequest[]): StreakRequestView[] {
  const views: StreakRequestView[] = [];
  for (const item of items) {
    views.push(toStreakRequestView(item));
  }
  return views;
}

export function sumStreakRequestView(view: StreakRequestView): number {
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  const parsedConversionRate = Number(view.conversionRateText);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRateText} is not a number`);
  const parsedSendAt = Number(view.sendAt);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAt} is not a number`);
  return parsedOpenRate + parsedConversionRate + parsedSendAt;
}
