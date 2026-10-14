import * as text from "../../../../kit/text.js";
import { FlightRollup } from "./flight-rollup.js";

/** How screens and exports show a flight rollup. */
export class FlightRollupView {
  codeText: string;
  label: string;
  bidText: string;
  expiresAt: string;
  active: string;
  ratioText: string;
  currency: string;
  externalRef: string;
  campaignRef: string;
  locale: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    bidText: string,
    expiresAt: string,
    active: string,
    ratioText: string,
    currency: string,
    externalRef: string,
    campaignRef: string,
    locale: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.bidText = bidText;
    this.expiresAt = expiresAt;
    this.active = active;
    this.ratioText = ratioText;
    this.currency = currency;
    this.externalRef = externalRef;
    this.campaignRef = campaignRef;
    this.locale = locale;
    this.statusLabel = statusLabel;
  }
}

export function toFlightRollupView(item: FlightRollup): FlightRollupView {
  return new FlightRollupView(
    item.code,
    item.label,
    item.bid.toFixed(2),
    String(item.expiresAt),
    `${item.active}`,
    item.ratio.toFixed(2),
    item.currency,
    text.truncate(item.externalRef, 80),
    item.campaignRef,
    item.locale,
    `${item.status}`.toUpperCase(),
  );
}

export function toFlightRollupViews(items: FlightRollup[]): FlightRollupView[] {
  const views: FlightRollupView[] = [];
  for (const item of items) {
    views.push(toFlightRollupView(item));
  }
  return views;
}

export function sumFlightRollupView(view: FlightRollupView): number {
  const parsedBid = Number(view.bidText);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bidText} is not a number`);
  const parsedExpiresAt = Number(view.expiresAt);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAt} is not a number`);
  const parsedRatio = Number(view.ratioText);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratioText} is not a number`);
  return parsedBid + parsedExpiresAt + parsedRatio;
}
