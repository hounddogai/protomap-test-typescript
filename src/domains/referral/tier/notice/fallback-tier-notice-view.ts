import { FallbackTierNotice } from "./fallback-tier-notice.js";

/** How screens and exports show a fallback tier notice. */
export class FallbackTierNoticeView {
  code: string;
  titleText: string;
  checksumText: string;
  source: string;
  variant: string;
  nameText: string;
  amountText: string;
  locale: string;
  region: string;
  rate: string;
  limit: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    checksumText: string,
    source: string,
    variant: string,
    nameText: string,
    amountText: string,
    locale: string,
    region: string,
    rate: string,
    limit: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.checksumText = checksumText;
    this.source = source;
    this.variant = variant;
    this.nameText = nameText;
    this.amountText = amountText;
    this.locale = locale;
    this.region = region;
    this.rate = rate;
    this.limit = limit;
    this.statusLabel = statusLabel;
  }
}

export function toFallbackTierNoticeView(item: FallbackTierNotice): FallbackTierNoticeView {
  return new FallbackTierNoticeView(
    item.code,
    item.title,
    item.checksum,
    item.source,
    item.variant,
    item.name,
    item.amount.toFixed(2),
    item.locale,
    item.region,
    item.rate.toFixed(2),
    String(item.limit),
    `${item.status}`.toUpperCase(),
  );
}

export function toFallbackTierNoticeViews(items: FallbackTierNotice[]): FallbackTierNoticeView[] {
  const views: FallbackTierNoticeView[] = [];
  for (const item of items) {
    views.push(toFallbackTierNoticeView(item));
  }
  return views;
}

export function sumFallbackTierNoticeView(view: FallbackTierNoticeView): number {
  const parsedAmount = Number(view.amountText);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amountText} is not a number`);
  const parsedRate = Number(view.rate);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rate} is not a number`);
  const parsedLimit = Number(view.limit);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limit} is not a number`);
  return parsedAmount + parsedRate + parsedLimit;
}
