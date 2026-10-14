import { AdaptivePayoutQuota } from "./adaptive-payout-quota.js";

/** How screens and exports show a adaptive payout quota. */
export class AdaptivePayoutQuotaView {
  code: string;
  label: string;
  rate: string;
  country: string;
  startsAt: string;
  ratio: string;
  budget: string;
  clicks: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    rate: string,
    country: string,
    startsAt: string,
    ratio: string,
    budget: string,
    clicks: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.rate = rate;
    this.country = country;
    this.startsAt = startsAt;
    this.ratio = ratio;
    this.budget = budget;
    this.clicks = clicks;
    this.statusLabel = statusLabel;
  }
}

export function toAdaptivePayoutQuotaView(item: AdaptivePayoutQuota): AdaptivePayoutQuotaView {
  return new AdaptivePayoutQuotaView(
    item.code,
    item.label,
    item.rate.toFixed(2),
    item.country,
    String(item.startsAt),
    item.ratio.toFixed(2),
    item.budget.toFixed(2),
    String(item.clicks),
    `${item.status}`.toUpperCase(),
  );
}

export function toAdaptivePayoutQuotaViews(items: AdaptivePayoutQuota[]): AdaptivePayoutQuotaView[] {
  const views: AdaptivePayoutQuotaView[] = [];
  for (const item of items) {
    views.push(toAdaptivePayoutQuotaView(item));
  }
  return views;
}

export function sumAdaptivePayoutQuotaView(view: AdaptivePayoutQuotaView): number {
  const parsedRate = Number(view.rate);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rate} is not a number`);
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  const parsedRatio = Number(view.ratio);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratio} is not a number`);
  return parsedRate + parsedStartsAt + parsedRatio;
}
