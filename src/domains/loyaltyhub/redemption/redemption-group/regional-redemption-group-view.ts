import * as text from "../../../../kit/text.js";
import { RegionalRedemptionGroup } from "./regional-redemption-group.js";

/** How screens and exports show a regional redemption group. */
export class RegionalRedemptionGroupView {
  codeText: string;
  nameText: string;
  rate: string;
  endsAt: string;
  locale: string;
  country: string;
  channelText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    nameText: string,
    rate: string,
    endsAt: string,
    locale: string,
    country: string,
    channelText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.nameText = nameText;
    this.rate = rate;
    this.endsAt = endsAt;
    this.locale = locale;
    this.country = country;
    this.channelText = channelText;
    this.statusLabel = statusLabel;
  }
}

export function toRegionalRedemptionGroupView(item: RegionalRedemptionGroup): RegionalRedemptionGroupView {
  return new RegionalRedemptionGroupView(
    item.code,
    text.truncate(item.name, 40),
    item.rate.toFixed(2),
    String(item.endsAt),
    item.locale,
    item.country,
    item.channel,
    `${item.status}`.toUpperCase(),
  );
}

export function toRegionalRedemptionGroupViews(items: RegionalRedemptionGroup[]): RegionalRedemptionGroupView[] {
  const views: RegionalRedemptionGroupView[] = [];
  for (const item of items) {
    views.push(toRegionalRedemptionGroupView(item));
  }
  return views;
}

export function sumRegionalRedemptionGroupView(view: RegionalRedemptionGroupView): number {
  const parsedRate = Number(view.rate);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rate} is not a number`);
  const parsedEndsAt = Number(view.endsAt);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAt} is not a number`);
  return parsedRate + parsedEndsAt;
}
