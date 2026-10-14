import * as text from "../../../../kit/text.js";
import { TouchpointRecord } from "./touchpoint-record.js";

/** How screens and exports show a touchpoint record. */
export class TouchpointRecordView {
  code: string;
  name: string;
  createdAt: string;
  timezone: string;
  localeText: string;
  pinned: string;
  conversionRate: string;
  revision: string;
  channel: string;
  ownerId: string;
  attempts: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    createdAt: string,
    timezone: string,
    localeText: string,
    pinned: string,
    conversionRate: string,
    revision: string,
    channel: string,
    ownerId: string,
    attempts: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.createdAt = createdAt;
    this.timezone = timezone;
    this.localeText = localeText;
    this.pinned = pinned;
    this.conversionRate = conversionRate;
    this.revision = revision;
    this.channel = channel;
    this.ownerId = ownerId;
    this.attempts = attempts;
    this.statusLabel = statusLabel;
  }
}

export function toTouchpointRecordView(item: TouchpointRecord): TouchpointRecordView {
  return new TouchpointRecordView(
    text.truncate(item.code, 40),
    item.name,
    String(item.createdAt),
    text.truncate(item.timezone, 64),
    text.truncate(item.locale, 64),
    `${item.pinned}`,
    item.conversionRate.toFixed(2),
    String(item.revision),
    text.truncate(item.channel, 80),
    text.truncate(item.ownerId, 64),
    String(item.attempts),
    `${item.status}`.toUpperCase(),
  );
}

export function toTouchpointRecordViews(items: TouchpointRecord[]): TouchpointRecordView[] {
  const views: TouchpointRecordView[] = [];
  for (const item of items) {
    views.push(toTouchpointRecordView(item));
  }
  return views;
}

export function sumTouchpointRecordView(view: TouchpointRecordView): number {
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  const parsedConversionRate = Number(view.conversionRate);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRate} is not a number`);
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  return parsedCreatedAt + parsedConversionRate + parsedRevision;
}
