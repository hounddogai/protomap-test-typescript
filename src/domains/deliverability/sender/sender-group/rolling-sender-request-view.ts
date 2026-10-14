import * as text from "../../../../kit/text.js";
import { RollingSenderRequest } from "./rolling-sender-request.js";

/** How screens and exports show a rolling sender request. */
export class RollingSenderRequestView {
  code: string;
  name: string;
  impressionsText: string;
  channelText: string;
  countryText: string;
  pinned: string;
  conversionRateText: string;
  sendAt: string;
  budgetText: string;
  createdAtText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    impressionsText: string,
    channelText: string,
    countryText: string,
    pinned: string,
    conversionRateText: string,
    sendAt: string,
    budgetText: string,
    createdAtText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.impressionsText = impressionsText;
    this.channelText = channelText;
    this.countryText = countryText;
    this.pinned = pinned;
    this.conversionRateText = conversionRateText;
    this.sendAt = sendAt;
    this.budgetText = budgetText;
    this.createdAtText = createdAtText;
    this.statusLabel = statusLabel;
  }
}

export function toRollingSenderRequestView(item: RollingSenderRequest): RollingSenderRequestView {
  return new RollingSenderRequestView(
    text.truncate(item.code, 120),
    item.name,
    String(item.impressions),
    item.channel,
    item.country,
    `${item.pinned}`,
    item.conversionRate.toFixed(2),
    String(item.sendAt),
    item.budget.toFixed(2),
    String(item.createdAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toRollingSenderRequestViews(items: RollingSenderRequest[]): RollingSenderRequestView[] {
  const views: RollingSenderRequestView[] = [];
  for (const item of items) {
    views.push(toRollingSenderRequestView(item));
  }
  return views;
}

export function sumRollingSenderRequestView(view: RollingSenderRequestView): number {
  const parsedImpressions = Number(view.impressionsText);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressionsText} is not a number`);
  const parsedConversionRate = Number(view.conversionRateText);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRateText} is not a number`);
  const parsedSendAt = Number(view.sendAt);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAt} is not a number`);
  return parsedImpressions + parsedConversionRate + parsedSendAt;
}
