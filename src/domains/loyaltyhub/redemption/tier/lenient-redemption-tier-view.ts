import * as text from "../../../../kit/text.js";
import { LenientRedemptionTier } from "./lenient-redemption-tier.js";

/** How screens and exports show a lenient redemption tier. */
export class LenientRedemptionTierView {
  code: string;
  name: string;
  currency: string;
  channelText: string;
  startsAt: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    currency: string,
    channelText: string,
    startsAt: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.currency = currency;
    this.channelText = channelText;
    this.startsAt = startsAt;
    this.statusLabel = statusLabel;
  }
}

export function toLenientRedemptionTierView(item: LenientRedemptionTier): LenientRedemptionTierView {
  return new LenientRedemptionTierView(
    item.code,
    item.name,
    text.truncate(item.currency, 64),
    item.channel,
    String(item.startsAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toLenientRedemptionTierViews(items: LenientRedemptionTier[]): LenientRedemptionTierView[] {
  const views: LenientRedemptionTierView[] = [];
  for (const item of items) {
    views.push(toLenientRedemptionTierView(item));
  }
  return views;
}

export function sumLenientRedemptionTierView(view: LenientRedemptionTierView): number {
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  return parsedStartsAt;
}
