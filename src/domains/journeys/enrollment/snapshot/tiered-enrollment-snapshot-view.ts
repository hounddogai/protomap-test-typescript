import * as text from "../../../../kit/text.js";
import { TieredEnrollmentSnapshot } from "./tiered-enrollment-snapshot.js";

/** How screens and exports show a tiered enrollment snapshot. */
export class TieredEnrollmentSnapshotView {
  code: string;
  labelText: string;
  sendAt: string;
  clicksText: string;
  segment: string;
  rate: string;
  channel: string;
  description: string;
  utmSource: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    sendAt: string,
    clicksText: string,
    segment: string,
    rate: string,
    channel: string,
    description: string,
    utmSource: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.sendAt = sendAt;
    this.clicksText = clicksText;
    this.segment = segment;
    this.rate = rate;
    this.channel = channel;
    this.description = description;
    this.utmSource = utmSource;
    this.statusLabel = statusLabel;
  }
}

export function toTieredEnrollmentSnapshotView(item: TieredEnrollmentSnapshot): TieredEnrollmentSnapshotView {
  return new TieredEnrollmentSnapshotView(
    text.truncate(item.code, 64),
    item.label,
    String(item.sendAt),
    String(item.clicks),
    text.truncate(item.segment, 120),
    item.rate.toFixed(2),
    item.channel,
    item.description,
    item.utmSource,
    `${item.status}`.toUpperCase(),
  );
}

export function toTieredEnrollmentSnapshotViews(items: TieredEnrollmentSnapshot[]): TieredEnrollmentSnapshotView[] {
  const views: TieredEnrollmentSnapshotView[] = [];
  for (const item of items) {
    views.push(toTieredEnrollmentSnapshotView(item));
  }
  return views;
}

export function sumTieredEnrollmentSnapshotView(view: TieredEnrollmentSnapshotView): number {
  const parsedSendAt = Number(view.sendAt);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAt} is not a number`);
  const parsedClicks = Number(view.clicksText);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicksText} is not a number`);
  const parsedRate = Number(view.rate);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rate} is not a number`);
  return parsedSendAt + parsedClicks + parsedRate;
}
