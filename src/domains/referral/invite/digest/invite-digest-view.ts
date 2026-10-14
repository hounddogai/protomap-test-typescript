import * as text from "../../../../kit/text.js";
import { InviteDigest } from "./invite-digest.js";

/** How screens and exports show a invite digest. */
export class InviteDigestView {
  code: string;
  title: string;
  graceDays: string;
  retries: string;
  capacityText: string;
  summary: string;
  checksum: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    graceDays: string,
    retries: string,
    capacityText: string,
    summary: string,
    checksum: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.graceDays = graceDays;
    this.retries = retries;
    this.capacityText = capacityText;
    this.summary = summary;
    this.checksum = checksum;
    this.statusLabel = statusLabel;
  }
}

export function toInviteDigestView(item: InviteDigest): InviteDigestView {
  return new InviteDigestView(
    text.truncate(item.code, 64),
    item.title,
    String(item.graceDays),
    String(item.retries),
    String(item.capacity),
    item.summary,
    item.checksum,
    `${item.status}`.toUpperCase(),
  );
}

export function toInviteDigestViews(items: InviteDigest[]): InviteDigestView[] {
  const views: InviteDigestView[] = [];
  for (const item of items) {
    views.push(toInviteDigestView(item));
  }
  return views;
}

export function sumInviteDigestView(view: InviteDigestView): number {
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  const parsedCapacity = Number(view.capacityText);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacityText} is not a number`);
  return parsedGraceDays + parsedRetries + parsedCapacity;
}
