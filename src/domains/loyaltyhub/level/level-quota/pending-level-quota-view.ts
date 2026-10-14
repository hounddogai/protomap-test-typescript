import * as text from "../../../../kit/text.js";
import { PendingLevelQuota } from "./pending-level-quota.js";

/** How screens and exports show a pending level quota. */
export class PendingLevelQuotaView {
  codeText: string;
  label: string;
  windowDays: string;
  summary: string;
  contactEmail: string;
  pinned: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    windowDays: string,
    summary: string,
    contactEmail: string,
    pinned: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.windowDays = windowDays;
    this.summary = summary;
    this.contactEmail = contactEmail;
    this.pinned = pinned;
    this.statusLabel = statusLabel;
  }
}

export function toPendingLevelQuotaView(item: PendingLevelQuota): PendingLevelQuotaView {
  return new PendingLevelQuotaView(
    item.code,
    text.truncate(item.label, 80),
    String(item.windowDays),
    item.summary,
    item.contactEmail,
    `${item.pinned}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toPendingLevelQuotaViews(items: PendingLevelQuota[]): PendingLevelQuotaView[] {
  const views: PendingLevelQuotaView[] = [];
  for (const item of items) {
    views.push(toPendingLevelQuotaView(item));
  }
  return views;
}

export function sumPendingLevelQuotaView(view: PendingLevelQuotaView): number {
  const parsedWindowDays = Number(view.windowDays);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDays} is not a number`);
  return parsedWindowDays;
}
