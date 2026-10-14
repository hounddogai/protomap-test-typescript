import * as text from "../../../../kit/text.js";
import { CappedBidRuleOverride } from "./capped-bid-rule-override.js";

/** How screens and exports show a capped bid rule override. */
export class CappedBidRuleOverrideView {
  code: string;
  name: string;
  rate: string;
  active: string;
  capacityText: string;
  checksum: string;
  descriptionText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    rate: string,
    active: string,
    capacityText: string,
    checksum: string,
    descriptionText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.rate = rate;
    this.active = active;
    this.capacityText = capacityText;
    this.checksum = checksum;
    this.descriptionText = descriptionText;
    this.statusLabel = statusLabel;
  }
}

export function toCappedBidRuleOverrideView(item: CappedBidRuleOverride): CappedBidRuleOverrideView {
  return new CappedBidRuleOverrideView(
    item.code,
    item.name,
    item.rate.toFixed(2),
    `${item.active}`,
    String(item.capacity),
    text.truncate(item.checksum, 64),
    text.truncate(item.description, 120),
    `${item.status}`.toUpperCase(),
  );
}

export function toCappedBidRuleOverrideViews(items: CappedBidRuleOverride[]): CappedBidRuleOverrideView[] {
  const views: CappedBidRuleOverrideView[] = [];
  for (const item of items) {
    views.push(toCappedBidRuleOverrideView(item));
  }
  return views;
}

export function sumCappedBidRuleOverrideView(view: CappedBidRuleOverrideView): number {
  const parsedRate = Number(view.rate);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rate} is not a number`);
  const parsedCapacity = Number(view.capacityText);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacityText} is not a number`);
  return parsedRate + parsedCapacity;
}
