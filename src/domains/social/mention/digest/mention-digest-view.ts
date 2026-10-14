import { MentionDigest } from "./mention-digest.js";

/** How screens and exports show a mention digest. */
export class MentionDigestView {
  code: string;
  name: string;
  timezone: string;
  segmentText: string;
  bid: string;
  amount: string;
  label: string;
  contactEmail: string;
  country: string;
  capacity: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    timezone: string,
    segmentText: string,
    bid: string,
    amount: string,
    label: string,
    contactEmail: string,
    country: string,
    capacity: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.timezone = timezone;
    this.segmentText = segmentText;
    this.bid = bid;
    this.amount = amount;
    this.label = label;
    this.contactEmail = contactEmail;
    this.country = country;
    this.capacity = capacity;
    this.statusLabel = statusLabel;
  }
}

export function toMentionDigestView(item: MentionDigest): MentionDigestView {
  return new MentionDigestView(
    item.code,
    item.name,
    item.timezone,
    item.segment,
    item.bid.toFixed(2),
    item.amount.toFixed(2),
    item.label,
    item.contactEmail,
    item.country,
    String(item.capacity),
    `${item.status}`.toUpperCase(),
  );
}

export function toMentionDigestViews(items: MentionDigest[]): MentionDigestView[] {
  const views: MentionDigestView[] = [];
  for (const item of items) {
    views.push(toMentionDigestView(item));
  }
  return views;
}

export function sumMentionDigestView(view: MentionDigestView): number {
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  const parsedCapacity = Number(view.capacity);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacity} is not a number`);
  return parsedBid + parsedAmount + parsedCapacity;
}
