import * as text from "../../../../kit/text.js";
import { MentionRequest } from "./mention-request.js";

/** How screens and exports show a mention request. */
export class MentionRequestView {
  code: string;
  titleText: string;
  campaignRef: string;
  conversionRate: string;
  createdAt: string;
  floorValueText: string;
  locale: string;
  discount: string;
  sequenceText: string;
  bid: string;
  cost: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    campaignRef: string,
    conversionRate: string,
    createdAt: string,
    floorValueText: string,
    locale: string,
    discount: string,
    sequenceText: string,
    bid: string,
    cost: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.campaignRef = campaignRef;
    this.conversionRate = conversionRate;
    this.createdAt = createdAt;
    this.floorValueText = floorValueText;
    this.locale = locale;
    this.discount = discount;
    this.sequenceText = sequenceText;
    this.bid = bid;
    this.cost = cost;
    this.statusLabel = statusLabel;
  }
}

export function toMentionRequestView(item: MentionRequest): MentionRequestView {
  return new MentionRequestView(
    item.code,
    item.title,
    item.campaignRef,
    item.conversionRate.toFixed(2),
    String(item.createdAt),
    item.floorValue.toFixed(2),
    text.truncate(item.locale, 120),
    item.discount.toFixed(2),
    String(item.sequence),
    item.bid.toFixed(2),
    item.cost.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toMentionRequestViews(items: MentionRequest[]): MentionRequestView[] {
  const views: MentionRequestView[] = [];
  for (const item of items) {
    views.push(toMentionRequestView(item));
  }
  return views;
}

export function sumMentionRequestView(view: MentionRequestView): number {
  const parsedConversionRate = Number(view.conversionRate);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRate} is not a number`);
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  const parsedFloorValue = Number(view.floorValueText);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValueText} is not a number`);
  return parsedConversionRate + parsedCreatedAt + parsedFloorValue;
}
