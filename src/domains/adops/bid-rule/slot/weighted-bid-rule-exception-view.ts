import * as text from "../../../../kit/text.js";
import { WeightedBidRuleException } from "./weighted-bid-rule-exception.js";

/** How screens and exports show a weighted bid rule exception. */
export class WeightedBidRuleExceptionView {
  code: string;
  title: string;
  capacityText: string;
  sendAt: string;
  name: string;
  source: string;
  phone: string;
  bidText: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    capacityText: string,
    sendAt: string,
    name: string,
    source: string,
    phone: string,
    bidText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.capacityText = capacityText;
    this.sendAt = sendAt;
    this.name = name;
    this.source = source;
    this.phone = phone;
    this.bidText = bidText;
    this.statusLabel = statusLabel;
  }
}

export function toWeightedBidRuleExceptionView(item: WeightedBidRuleException): WeightedBidRuleExceptionView {
  return new WeightedBidRuleExceptionView(
    item.code,
    item.title,
    String(item.capacity),
    String(item.sendAt),
    text.truncate(item.name, 120),
    item.source,
    text.truncate(item.phone, 120),
    item.bid.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toWeightedBidRuleExceptionViews(items: WeightedBidRuleException[]): WeightedBidRuleExceptionView[] {
  const views: WeightedBidRuleExceptionView[] = [];
  for (const item of items) {
    views.push(toWeightedBidRuleExceptionView(item));
  }
  return views;
}

export function sumWeightedBidRuleExceptionView(view: WeightedBidRuleExceptionView): number {
  const parsedCapacity = Number(view.capacityText);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacityText} is not a number`);
  const parsedSendAt = Number(view.sendAt);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAt} is not a number`);
  const parsedBid = Number(view.bidText);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bidText} is not a number`);
  return parsedCapacity + parsedSendAt + parsedBid;
}
