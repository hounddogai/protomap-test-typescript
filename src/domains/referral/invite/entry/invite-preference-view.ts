import * as text from "../../../../kit/text.js";
import { InvitePreference } from "./invite-preference.js";

/** How screens and exports show a invite preference. */
export class InvitePreferenceView {
  codeText: string;
  name: string;
  bid: string;
  expiresAtText: string;
  startsAt: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    bid: string,
    expiresAtText: string,
    startsAt: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.bid = bid;
    this.expiresAtText = expiresAtText;
    this.startsAt = startsAt;
    this.statusLabel = statusLabel;
  }
}

export function toInvitePreferenceView(item: InvitePreference): InvitePreferenceView {
  return new InvitePreferenceView(
    item.code,
    text.truncate(item.name, 120),
    item.bid.toFixed(2),
    String(item.expiresAt),
    String(item.startsAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toInvitePreferenceViews(items: InvitePreference[]): InvitePreferenceView[] {
  const views: InvitePreferenceView[] = [];
  for (const item of items) {
    views.push(toInvitePreferenceView(item));
  }
  return views;
}

export function sumInvitePreferenceView(view: InvitePreferenceView): number {
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  const parsedExpiresAt = Number(view.expiresAtText);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAtText} is not a number`);
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  return parsedBid + parsedExpiresAt + parsedStartsAt;
}
