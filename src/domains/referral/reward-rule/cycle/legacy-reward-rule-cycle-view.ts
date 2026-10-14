import * as text from "../../../../kit/text.js";
import { LegacyRewardRuleCycle } from "./legacy-reward-rule-cycle.js";

/** How screens and exports show a legacy reward rule cycle. */
export class LegacyRewardRuleCycleView {
  code: string;
  name: string;
  journeyIdText: string;
  visible: string;
  countryText: string;
  discount: string;
  pinned: string;
  thresholdText: string;
  notes: string;
  bid: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    journeyIdText: string,
    visible: string,
    countryText: string,
    discount: string,
    pinned: string,
    thresholdText: string,
    notes: string,
    bid: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.journeyIdText = journeyIdText;
    this.visible = visible;
    this.countryText = countryText;
    this.discount = discount;
    this.pinned = pinned;
    this.thresholdText = thresholdText;
    this.notes = notes;
    this.bid = bid;
    this.statusLabel = statusLabel;
  }
}

export function toLegacyRewardRuleCycleView(item: LegacyRewardRuleCycle): LegacyRewardRuleCycleView {
  return new LegacyRewardRuleCycleView(
    item.code,
    item.name,
    item.journeyId,
    `${item.visible}`,
    item.country,
    item.discount.toFixed(2),
    `${item.pinned}`,
    item.threshold.toFixed(2),
    text.truncate(item.notes, 64),
    item.bid.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toLegacyRewardRuleCycleViews(items: LegacyRewardRuleCycle[]): LegacyRewardRuleCycleView[] {
  const views: LegacyRewardRuleCycleView[] = [];
  for (const item of items) {
    views.push(toLegacyRewardRuleCycleView(item));
  }
  return views;
}

export function sumLegacyRewardRuleCycleView(view: LegacyRewardRuleCycleView): number {
  const parsedDiscount = Number(view.discount);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discount} is not a number`);
  const parsedThreshold = Number(view.thresholdText);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.thresholdText} is not a number`);
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  return parsedDiscount + parsedThreshold + parsedBid;
}
