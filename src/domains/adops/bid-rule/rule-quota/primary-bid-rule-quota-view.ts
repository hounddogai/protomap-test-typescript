import * as text from "../../../../kit/text.js";
import { PrimaryBidRuleQuota } from "./primary-bid-rule-quota.js";

/** How screens and exports show a primary bid rule quota. */
export class PrimaryBidRuleQuotaView {
  code: string;
  title: string;
  maximum: string;
  externalRefText: string;
  marginText: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    maximum: string,
    externalRefText: string,
    marginText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.maximum = maximum;
    this.externalRefText = externalRefText;
    this.marginText = marginText;
    this.statusLabel = statusLabel;
  }
}

export function toPrimaryBidRuleQuotaView(item: PrimaryBidRuleQuota): PrimaryBidRuleQuotaView {
  return new PrimaryBidRuleQuotaView(
    text.truncate(item.code, 40),
    item.title,
    item.maximum.toFixed(2),
    item.externalRef,
    item.margin.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toPrimaryBidRuleQuotaViews(items: PrimaryBidRuleQuota[]): PrimaryBidRuleQuotaView[] {
  const views: PrimaryBidRuleQuotaView[] = [];
  for (const item of items) {
    views.push(toPrimaryBidRuleQuotaView(item));
  }
  return views;
}

export function sumPrimaryBidRuleQuotaView(view: PrimaryBidRuleQuotaView): number {
  const parsedMaximum = Number(view.maximum);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximum} is not a number`);
  const parsedMargin = Number(view.marginText);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.marginText} is not a number`);
  return parsedMaximum + parsedMargin;
}
