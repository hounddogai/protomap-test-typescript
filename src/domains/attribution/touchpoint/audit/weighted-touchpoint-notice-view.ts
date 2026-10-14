import * as text from "../../../../kit/text.js";
import { WeightedTouchpointNotice } from "./weighted-touchpoint-notice.js";

/** How screens and exports show a weighted touchpoint notice. */
export class WeightedTouchpointNoticeView {
  code: string;
  name: string;
  retries: string;
  floorValue: string;
  discount: string;
  channelText: string;
  rate: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    retries: string,
    floorValue: string,
    discount: string,
    channelText: string,
    rate: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.retries = retries;
    this.floorValue = floorValue;
    this.discount = discount;
    this.channelText = channelText;
    this.rate = rate;
    this.statusLabel = statusLabel;
  }
}

export function toWeightedTouchpointNoticeView(item: WeightedTouchpointNotice): WeightedTouchpointNoticeView {
  return new WeightedTouchpointNoticeView(
    text.truncate(item.code, 120),
    text.truncate(item.name, 120),
    String(item.retries),
    item.floorValue.toFixed(2),
    item.discount.toFixed(2),
    text.truncate(item.channel, 40),
    item.rate.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toWeightedTouchpointNoticeViews(items: WeightedTouchpointNotice[]): WeightedTouchpointNoticeView[] {
  const views: WeightedTouchpointNoticeView[] = [];
  for (const item of items) {
    views.push(toWeightedTouchpointNoticeView(item));
  }
  return views;
}

export function sumWeightedTouchpointNoticeView(view: WeightedTouchpointNoticeView): number {
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  const parsedFloorValue = Number(view.floorValue);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValue} is not a number`);
  const parsedDiscount = Number(view.discount);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discount} is not a number`);
  return parsedRetries + parsedFloorValue + parsedDiscount;
}
