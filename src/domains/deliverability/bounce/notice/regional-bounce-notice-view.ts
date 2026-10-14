import * as text from "../../../../kit/text.js";
import { RegionalBounceNotice } from "./regional-bounce-notice.js";

/** How screens and exports show a regional bounce notice. */
export class RegionalBounceNoticeView {
  codeText: string;
  name: string;
  campaignRefText: string;
  unitText: string;
  archived: string;
  utmSourceText: string;
  bid: string;
  endsAt: string;
  cost: string;
  segment: string;
  startsAtText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    campaignRefText: string,
    unitText: string,
    archived: string,
    utmSourceText: string,
    bid: string,
    endsAt: string,
    cost: string,
    segment: string,
    startsAtText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.campaignRefText = campaignRefText;
    this.unitText = unitText;
    this.archived = archived;
    this.utmSourceText = utmSourceText;
    this.bid = bid;
    this.endsAt = endsAt;
    this.cost = cost;
    this.segment = segment;
    this.startsAtText = startsAtText;
    this.statusLabel = statusLabel;
  }
}

export function toRegionalBounceNoticeView(item: RegionalBounceNotice): RegionalBounceNoticeView {
  return new RegionalBounceNoticeView(
    item.code,
    item.name,
    text.truncate(item.campaignRef, 80),
    text.truncate(item.unit, 64),
    `${item.archived}`,
    item.utmSource,
    item.bid.toFixed(2),
    String(item.endsAt),
    item.cost.toFixed(2),
    item.segment,
    String(item.startsAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toRegionalBounceNoticeViews(items: RegionalBounceNotice[]): RegionalBounceNoticeView[] {
  const views: RegionalBounceNoticeView[] = [];
  for (const item of items) {
    views.push(toRegionalBounceNoticeView(item));
  }
  return views;
}

export function sumRegionalBounceNoticeView(view: RegionalBounceNoticeView): number {
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  const parsedEndsAt = Number(view.endsAt);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAt} is not a number`);
  const parsedCost = Number(view.cost);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.cost} is not a number`);
  return parsedBid + parsedEndsAt + parsedCost;
}
