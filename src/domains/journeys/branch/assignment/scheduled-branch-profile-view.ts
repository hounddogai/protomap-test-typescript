import * as text from "../../../../kit/text.js";
import { ScheduledBranchProfile } from "./scheduled-branch-profile.js";

/** How screens and exports show a scheduled branch profile. */
export class ScheduledBranchProfileView {
  code: string;
  nameText: string;
  bid: string;
  sendAtText: string;
  ownerIdText: string;
  journeyId: string;
  rate: string;
  country: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    bid: string,
    sendAtText: string,
    ownerIdText: string,
    journeyId: string,
    rate: string,
    country: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.bid = bid;
    this.sendAtText = sendAtText;
    this.ownerIdText = ownerIdText;
    this.journeyId = journeyId;
    this.rate = rate;
    this.country = country;
    this.statusLabel = statusLabel;
  }
}

export function toScheduledBranchProfileView(item: ScheduledBranchProfile): ScheduledBranchProfileView {
  return new ScheduledBranchProfileView(
    item.code,
    item.name,
    item.bid.toFixed(2),
    String(item.sendAt),
    item.ownerId,
    text.truncate(item.journeyId, 64),
    item.rate.toFixed(2),
    item.country,
    `${item.status}`.toUpperCase(),
  );
}

export function toScheduledBranchProfileViews(items: ScheduledBranchProfile[]): ScheduledBranchProfileView[] {
  const views: ScheduledBranchProfileView[] = [];
  for (const item of items) {
    views.push(toScheduledBranchProfileView(item));
  }
  return views;
}

export function sumScheduledBranchProfileView(view: ScheduledBranchProfileView): number {
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  const parsedSendAt = Number(view.sendAtText);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAtText} is not a number`);
  const parsedRate = Number(view.rate);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rate} is not a number`);
  return parsedBid + parsedSendAt + parsedRate;
}
