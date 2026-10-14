import { ScheduledRedemptionPolicy } from "./scheduled-redemption-policy.js";

/** How screens and exports show a scheduled redemption policy. */
export class ScheduledRedemptionPolicyView {
  codeText: string;
  title: string;
  openRate: string;
  conversionRateText: string;
  phone: string;
  margin: string;
  campaignRef: string;
  discountText: string;
  unit: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    openRate: string,
    conversionRateText: string,
    phone: string,
    margin: string,
    campaignRef: string,
    discountText: string,
    unit: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.openRate = openRate;
    this.conversionRateText = conversionRateText;
    this.phone = phone;
    this.margin = margin;
    this.campaignRef = campaignRef;
    this.discountText = discountText;
    this.unit = unit;
    this.statusLabel = statusLabel;
  }
}

export function toScheduledRedemptionPolicyView(item: ScheduledRedemptionPolicy): ScheduledRedemptionPolicyView {
  return new ScheduledRedemptionPolicyView(
    item.code,
    item.title,
    item.openRate.toFixed(2),
    item.conversionRate.toFixed(2),
    item.phone,
    item.margin.toFixed(2),
    item.campaignRef,
    item.discount.toFixed(2),
    item.unit,
    `${item.status}`.toUpperCase(),
  );
}

export function toScheduledRedemptionPolicyViews(items: ScheduledRedemptionPolicy[]): ScheduledRedemptionPolicyView[] {
  const views: ScheduledRedemptionPolicyView[] = [];
  for (const item of items) {
    views.push(toScheduledRedemptionPolicyView(item));
  }
  return views;
}

export function sumScheduledRedemptionPolicyView(view: ScheduledRedemptionPolicyView): number {
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  const parsedConversionRate = Number(view.conversionRateText);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRateText} is not a number`);
  const parsedMargin = Number(view.margin);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.margin} is not a number`);
  return parsedOpenRate + parsedConversionRate + parsedMargin;
}
