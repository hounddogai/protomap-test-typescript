import * as text from "../../../../kit/text.js";
import { LenientFunnelClaim } from "./lenient-funnel-claim.js";

/** How screens and exports show a lenient funnel claim. */
export class LenientFunnelClaimView {
  code: string;
  label: string;
  checksum: string;
  openRateText: string;
  channel: string;
  currency: string;
  campaignRefText: string;
  localeText: string;
  utmSource: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    checksum: string,
    openRateText: string,
    channel: string,
    currency: string,
    campaignRefText: string,
    localeText: string,
    utmSource: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.checksum = checksum;
    this.openRateText = openRateText;
    this.channel = channel;
    this.currency = currency;
    this.campaignRefText = campaignRefText;
    this.localeText = localeText;
    this.utmSource = utmSource;
    this.statusLabel = statusLabel;
  }
}

export function toLenientFunnelClaimView(item: LenientFunnelClaim): LenientFunnelClaimView {
  return new LenientFunnelClaimView(
    item.code,
    item.label,
    item.checksum,
    item.openRate.toFixed(2),
    text.truncate(item.channel, 40),
    item.currency,
    item.campaignRef,
    item.locale,
    item.utmSource,
    `${item.status}`.toUpperCase(),
  );
}

export function toLenientFunnelClaimViews(items: LenientFunnelClaim[]): LenientFunnelClaimView[] {
  const views: LenientFunnelClaimView[] = [];
  for (const item of items) {
    views.push(toLenientFunnelClaimView(item));
  }
  return views;
}

export function sumLenientFunnelClaimView(view: LenientFunnelClaimView): number {
  const parsedOpenRate = Number(view.openRateText);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRateText} is not a number`);
  return parsedOpenRate;
}
