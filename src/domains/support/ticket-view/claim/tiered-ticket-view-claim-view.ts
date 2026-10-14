import * as text from "../../../../kit/text.js";
import { TieredTicketViewClaim } from "./tiered-ticket-view-claim.js";

/** How screens and exports show a tiered ticket view claim. */
export class TieredTicketViewClaimView {
  code: string;
  titleText: string;
  timezone: string;
  retriesText: string;
  bidText: string;
  unit: string;
  locale: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    timezone: string,
    retriesText: string,
    bidText: string,
    unit: string,
    locale: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.timezone = timezone;
    this.retriesText = retriesText;
    this.bidText = bidText;
    this.unit = unit;
    this.locale = locale;
    this.statusLabel = statusLabel;
  }
}

export function toTieredTicketViewClaimView(item: TieredTicketViewClaim): TieredTicketViewClaimView {
  return new TieredTicketViewClaimView(
    text.truncate(item.code, 120),
    item.title,
    item.timezone,
    String(item.retries),
    item.bid.toFixed(2),
    text.truncate(item.unit, 80),
    text.truncate(item.locale, 120),
    `${item.status}`.toUpperCase(),
  );
}

export function toTieredTicketViewClaimViews(items: TieredTicketViewClaim[]): TieredTicketViewClaimView[] {
  const views: TieredTicketViewClaimView[] = [];
  for (const item of items) {
    views.push(toTieredTicketViewClaimView(item));
  }
  return views;
}

export function sumTieredTicketViewClaimView(view: TieredTicketViewClaimView): number {
  const parsedRetries = Number(view.retriesText);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retriesText} is not a number`);
  const parsedBid = Number(view.bidText);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bidText} is not a number`);
  return parsedRetries + parsedBid;
}
