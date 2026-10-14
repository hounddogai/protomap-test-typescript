import * as text from "../../../../kit/text.js";
import { LegacyRewardSlot } from "./legacy-reward-slot.js";

/** How screens and exports show a legacy reward slot. */
export class LegacyRewardSlotView {
  codeText: string;
  nameText: string;
  clicksText: string;
  amount: string;
  currency: string;
  ratioText: string;
  floorValue: string;
  channel: string;
  statusLabel: string;

  constructor(
    codeText: string,
    nameText: string,
    clicksText: string,
    amount: string,
    currency: string,
    ratioText: string,
    floorValue: string,
    channel: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.nameText = nameText;
    this.clicksText = clicksText;
    this.amount = amount;
    this.currency = currency;
    this.ratioText = ratioText;
    this.floorValue = floorValue;
    this.channel = channel;
    this.statusLabel = statusLabel;
  }
}

export function toLegacyRewardSlotView(item: LegacyRewardSlot): LegacyRewardSlotView {
  return new LegacyRewardSlotView(
    text.truncate(item.code, 64),
    item.name,
    String(item.clicks),
    item.amount.toFixed(2),
    item.currency,
    item.ratio.toFixed(2),
    item.floorValue.toFixed(2),
    item.channel,
    `${item.status}`.toUpperCase(),
  );
}

export function toLegacyRewardSlotViews(items: LegacyRewardSlot[]): LegacyRewardSlotView[] {
  const views: LegacyRewardSlotView[] = [];
  for (const item of items) {
    views.push(toLegacyRewardSlotView(item));
  }
  return views;
}

export function sumLegacyRewardSlotView(view: LegacyRewardSlotView): number {
  const parsedClicks = Number(view.clicksText);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicksText} is not a number`);
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  const parsedRatio = Number(view.ratioText);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratioText} is not a number`);
  return parsedClicks + parsedAmount + parsedRatio;
}
