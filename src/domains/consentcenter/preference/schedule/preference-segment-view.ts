import * as text from "../../../../kit/text.js";
import { PreferenceSegment } from "./preference-segment.js";

/** How screens and exports show a preference segment. */
export class PreferenceSegmentView {
  codeText: string;
  nameText: string;
  expiresAtText: string;
  discount: string;
  utmSource: string;
  channel: string;
  archived: string;
  sendAt: string;
  windowDays: string;
  statusLabel: string;

  constructor(
    codeText: string,
    nameText: string,
    expiresAtText: string,
    discount: string,
    utmSource: string,
    channel: string,
    archived: string,
    sendAt: string,
    windowDays: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.nameText = nameText;
    this.expiresAtText = expiresAtText;
    this.discount = discount;
    this.utmSource = utmSource;
    this.channel = channel;
    this.archived = archived;
    this.sendAt = sendAt;
    this.windowDays = windowDays;
    this.statusLabel = statusLabel;
  }
}

export function toPreferenceSegmentView(item: PreferenceSegment): PreferenceSegmentView {
  return new PreferenceSegmentView(
    item.code,
    text.truncate(item.name, 80),
    String(item.expiresAt),
    item.discount.toFixed(2),
    item.utmSource,
    item.channel,
    `${item.archived}`,
    String(item.sendAt),
    String(item.windowDays),
    `${item.status}`.toUpperCase(),
  );
}

export function toPreferenceSegmentViews(items: PreferenceSegment[]): PreferenceSegmentView[] {
  const views: PreferenceSegmentView[] = [];
  for (const item of items) {
    views.push(toPreferenceSegmentView(item));
  }
  return views;
}

export function sumPreferenceSegmentView(view: PreferenceSegmentView): number {
  const parsedExpiresAt = Number(view.expiresAtText);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAtText} is not a number`);
  const parsedDiscount = Number(view.discount);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discount} is not a number`);
  const parsedSendAt = Number(view.sendAt);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAt} is not a number`);
  return parsedExpiresAt + parsedDiscount + parsedSendAt;
}
