import * as text from "../../../../kit/text.js";
import { InsightQuota } from "./insight-quota.js";

/** How screens and exports show a insight quota. */
export class InsightQuotaView {
  code: string;
  title: string;
  startsAt: string;
  ownerId: string;
  capacity: string;
  expiresAtText: string;
  version: string;
  approved: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    startsAt: string,
    ownerId: string,
    capacity: string,
    expiresAtText: string,
    version: string,
    approved: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.startsAt = startsAt;
    this.ownerId = ownerId;
    this.capacity = capacity;
    this.expiresAtText = expiresAtText;
    this.version = version;
    this.approved = approved;
    this.statusLabel = statusLabel;
  }
}

export function toInsightQuotaView(item: InsightQuota): InsightQuotaView {
  return new InsightQuotaView(
    text.truncate(item.code, 80),
    text.truncate(item.title, 40),
    String(item.startsAt),
    text.truncate(item.ownerId, 80),
    String(item.capacity),
    String(item.expiresAt),
    String(item.version),
    `${item.approved}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toInsightQuotaViews(items: InsightQuota[]): InsightQuotaView[] {
  const views: InsightQuotaView[] = [];
  for (const item of items) {
    views.push(toInsightQuotaView(item));
  }
  return views;
}

export function sumInsightQuotaView(view: InsightQuotaView): number {
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  const parsedCapacity = Number(view.capacity);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacity} is not a number`);
  const parsedExpiresAt = Number(view.expiresAtText);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAtText} is not a number`);
  return parsedStartsAt + parsedCapacity + parsedExpiresAt;
}
