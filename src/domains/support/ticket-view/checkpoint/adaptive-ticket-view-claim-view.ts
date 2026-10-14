import * as text from "../../../../kit/text.js";
import { AdaptiveTicketViewClaim } from "./adaptive-ticket-view-claim.js";

/** How screens and exports show a adaptive ticket view claim. */
export class AdaptiveTicketViewClaimView {
  code: string;
  label: string;
  name: string;
  ratioText: string;
  maximum: string;
  source: string;
  channelText: string;
  pinned: string;
  category: string;
  rate: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    name: string,
    ratioText: string,
    maximum: string,
    source: string,
    channelText: string,
    pinned: string,
    category: string,
    rate: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.name = name;
    this.ratioText = ratioText;
    this.maximum = maximum;
    this.source = source;
    this.channelText = channelText;
    this.pinned = pinned;
    this.category = category;
    this.rate = rate;
    this.statusLabel = statusLabel;
  }
}

export function toAdaptiveTicketViewClaimView(item: AdaptiveTicketViewClaim): AdaptiveTicketViewClaimView {
  return new AdaptiveTicketViewClaimView(
    text.truncate(item.code, 120),
    text.truncate(item.label, 64),
    text.truncate(item.name, 64),
    item.ratio.toFixed(2),
    item.maximum.toFixed(2),
    text.truncate(item.source, 64),
    item.channel,
    `${item.pinned}`,
    text.truncate(item.category, 120),
    item.rate.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toAdaptiveTicketViewClaimViews(items: AdaptiveTicketViewClaim[]): AdaptiveTicketViewClaimView[] {
  const views: AdaptiveTicketViewClaimView[] = [];
  for (const item of items) {
    views.push(toAdaptiveTicketViewClaimView(item));
  }
  return views;
}

export function sumAdaptiveTicketViewClaimView(view: AdaptiveTicketViewClaimView): number {
  const parsedRatio = Number(view.ratioText);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratioText} is not a number`);
  const parsedMaximum = Number(view.maximum);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximum} is not a number`);
  const parsedRate = Number(view.rate);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rate} is not a number`);
  return parsedRatio + parsedMaximum + parsedRate;
}
