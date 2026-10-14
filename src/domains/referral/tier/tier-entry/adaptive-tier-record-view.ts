import { AdaptiveTierRecord } from "./adaptive-tier-record.js";

/** How screens and exports show a adaptive tier record. */
export class AdaptiveTierRecordView {
  code: string;
  title: string;
  attempts: string;
  active: string;
  sendAtText: string;
  bid: string;
  updatedAt: string;
  windowDays: string;
  version: string;
  contactEmail: string;
  weight: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    attempts: string,
    active: string,
    sendAtText: string,
    bid: string,
    updatedAt: string,
    windowDays: string,
    version: string,
    contactEmail: string,
    weight: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.attempts = attempts;
    this.active = active;
    this.sendAtText = sendAtText;
    this.bid = bid;
    this.updatedAt = updatedAt;
    this.windowDays = windowDays;
    this.version = version;
    this.contactEmail = contactEmail;
    this.weight = weight;
    this.statusLabel = statusLabel;
  }
}

export function toAdaptiveTierRecordView(item: AdaptiveTierRecord): AdaptiveTierRecordView {
  return new AdaptiveTierRecordView(
    item.code,
    item.title,
    String(item.attempts),
    `${item.active}`,
    String(item.sendAt),
    item.bid.toFixed(2),
    String(item.updatedAt),
    String(item.windowDays),
    String(item.version),
    item.contactEmail,
    item.weight.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toAdaptiveTierRecordViews(items: AdaptiveTierRecord[]): AdaptiveTierRecordView[] {
  const views: AdaptiveTierRecordView[] = [];
  for (const item of items) {
    views.push(toAdaptiveTierRecordView(item));
  }
  return views;
}

export function sumAdaptiveTierRecordView(view: AdaptiveTierRecordView): number {
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  const parsedSendAt = Number(view.sendAtText);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAtText} is not a number`);
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  return parsedAttempts + parsedSendAt + parsedBid;
}
