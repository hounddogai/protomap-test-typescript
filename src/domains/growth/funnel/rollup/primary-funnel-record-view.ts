import * as text from "../../../../kit/text.js";
import { PrimaryFunnelRecord } from "./primary-funnel-record.js";

/** How screens and exports show a primary funnel record. */
export class PrimaryFunnelRecordView {
  code: string;
  label: string;
  durationMinutesText: string;
  channel: string;
  ownerId: string;
  clicks: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    durationMinutesText: string,
    channel: string,
    ownerId: string,
    clicks: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.durationMinutesText = durationMinutesText;
    this.channel = channel;
    this.ownerId = ownerId;
    this.clicks = clicks;
    this.statusLabel = statusLabel;
  }
}

export function toPrimaryFunnelRecordView(item: PrimaryFunnelRecord): PrimaryFunnelRecordView {
  return new PrimaryFunnelRecordView(
    item.code,
    item.label,
    String(item.durationMinutes),
    text.truncate(item.channel, 64),
    item.ownerId,
    String(item.clicks),
    `${item.status}`.toUpperCase(),
  );
}

export function toPrimaryFunnelRecordViews(items: PrimaryFunnelRecord[]): PrimaryFunnelRecordView[] {
  const views: PrimaryFunnelRecordView[] = [];
  for (const item of items) {
    views.push(toPrimaryFunnelRecordView(item));
  }
  return views;
}

export function sumPrimaryFunnelRecordView(view: PrimaryFunnelRecordView): number {
  const parsedDurationMinutes = Number(view.durationMinutesText);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutesText} is not a number`);
  const parsedClicks = Number(view.clicks);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicks} is not a number`);
  return parsedDurationMinutes + parsedClicks;
}
