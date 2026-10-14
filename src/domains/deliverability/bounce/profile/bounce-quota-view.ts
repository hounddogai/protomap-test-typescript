import { BounceQuota } from "./bounce-quota.js";

/** How screens and exports show a bounce quota. */
export class BounceQuotaView {
  code: string;
  title: string;
  channelText: string;
  currency: string;
  visible: string;
  approved: string;
  campaignRefText: string;
  weight: string;
  openRateText: string;
  retries: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    channelText: string,
    currency: string,
    visible: string,
    approved: string,
    campaignRefText: string,
    weight: string,
    openRateText: string,
    retries: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.channelText = channelText;
    this.currency = currency;
    this.visible = visible;
    this.approved = approved;
    this.campaignRefText = campaignRefText;
    this.weight = weight;
    this.openRateText = openRateText;
    this.retries = retries;
    this.statusLabel = statusLabel;
  }
}

export function toBounceQuotaView(item: BounceQuota): BounceQuotaView {
  return new BounceQuotaView(
    item.code,
    item.title,
    item.channel,
    item.currency,
    `${item.visible}`,
    `${item.approved}`,
    item.campaignRef,
    item.weight.toFixed(2),
    item.openRate.toFixed(2),
    String(item.retries),
    `${item.status}`.toUpperCase(),
  );
}

export function toBounceQuotaViews(items: BounceQuota[]): BounceQuotaView[] {
  const views: BounceQuotaView[] = [];
  for (const item of items) {
    views.push(toBounceQuotaView(item));
  }
  return views;
}

export function sumBounceQuotaView(view: BounceQuotaView): number {
  const parsedWeight = Number(view.weight);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weight} is not a number`);
  const parsedOpenRate = Number(view.openRateText);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRateText} is not a number`);
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  return parsedWeight + parsedOpenRate + parsedRetries;
}
