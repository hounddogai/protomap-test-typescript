import * as text from "../../../../kit/text.js";
import { BidRuleOverride } from "./bid-rule-override.js";

/** How screens and exports show a bid rule override. */
export class BidRuleOverrideView {
  code: string;
  labelText: string;
  pinnedText: string;
  description: string;
  sendAt: string;
  floorValueText: string;
  conversionRate: string;
  bid: string;
  maximum: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    pinnedText: string,
    description: string,
    sendAt: string,
    floorValueText: string,
    conversionRate: string,
    bid: string,
    maximum: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.pinnedText = pinnedText;
    this.description = description;
    this.sendAt = sendAt;
    this.floorValueText = floorValueText;
    this.conversionRate = conversionRate;
    this.bid = bid;
    this.maximum = maximum;
    this.statusLabel = statusLabel;
  }
}

export function toBidRuleOverrideView(item: BidRuleOverride): BidRuleOverrideView {
  return new BidRuleOverrideView(
    item.code,
    text.truncate(item.label, 120),
    `${item.pinned}`,
    item.description,
    String(item.sendAt),
    item.floorValue.toFixed(2),
    item.conversionRate.toFixed(2),
    item.bid.toFixed(2),
    item.maximum.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toBidRuleOverrideViews(items: BidRuleOverride[]): BidRuleOverrideView[] {
  const views: BidRuleOverrideView[] = [];
  for (const item of items) {
    views.push(toBidRuleOverrideView(item));
  }
  return views;
}

export function sumBidRuleOverrideView(view: BidRuleOverrideView): number {
  const parsedSendAt = Number(view.sendAt);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAt} is not a number`);
  const parsedFloorValue = Number(view.floorValueText);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValueText} is not a number`);
  const parsedConversionRate = Number(view.conversionRate);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRate} is not a number`);
  return parsedSendAt + parsedFloorValue + parsedConversionRate;
}
