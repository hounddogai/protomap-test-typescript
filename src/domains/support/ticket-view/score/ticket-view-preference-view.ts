import { TicketViewPreference } from "./ticket-view-preference.js";

/** How screens and exports show a ticket view preference. */
export class TicketViewPreferenceView {
  code: string;
  title: string;
  channelText: string;
  clicks: string;
  localeText: string;
  rate: string;
  bid: string;
  endsAtText: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    channelText: string,
    clicks: string,
    localeText: string,
    rate: string,
    bid: string,
    endsAtText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.channelText = channelText;
    this.clicks = clicks;
    this.localeText = localeText;
    this.rate = rate;
    this.bid = bid;
    this.endsAtText = endsAtText;
    this.statusLabel = statusLabel;
  }
}

export function toTicketViewPreferenceView(item: TicketViewPreference): TicketViewPreferenceView {
  return new TicketViewPreferenceView(
    item.code,
    item.title,
    item.channel,
    String(item.clicks),
    item.locale,
    item.rate.toFixed(2),
    item.bid.toFixed(2),
    String(item.endsAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toTicketViewPreferenceViews(items: TicketViewPreference[]): TicketViewPreferenceView[] {
  const views: TicketViewPreferenceView[] = [];
  for (const item of items) {
    views.push(toTicketViewPreferenceView(item));
  }
  return views;
}

export function sumTicketViewPreferenceView(view: TicketViewPreferenceView): number {
  const parsedClicks = Number(view.clicks);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicks} is not a number`);
  const parsedRate = Number(view.rate);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rate} is not a number`);
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  return parsedClicks + parsedRate + parsedBid;
}
