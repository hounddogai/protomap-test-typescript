import * as text from "../../../../kit/text.js";
import { LegacyOptOutSegment } from "./legacy-opt-out-segment.js";

/** How screens and exports show a legacy opt out segment. */
export class LegacyOptOutSegmentView {
  code: string;
  labelText: string;
  maximum: string;
  timezone: string;
  visible: string;
  sendAtText: string;
  region: string;
  phone: string;
  locale: string;
  channelText: string;
  revision: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    maximum: string,
    timezone: string,
    visible: string,
    sendAtText: string,
    region: string,
    phone: string,
    locale: string,
    channelText: string,
    revision: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.maximum = maximum;
    this.timezone = timezone;
    this.visible = visible;
    this.sendAtText = sendAtText;
    this.region = region;
    this.phone = phone;
    this.locale = locale;
    this.channelText = channelText;
    this.revision = revision;
    this.statusLabel = statusLabel;
  }
}

export function toLegacyOptOutSegmentView(item: LegacyOptOutSegment): LegacyOptOutSegmentView {
  return new LegacyOptOutSegmentView(
    text.truncate(item.code, 120),
    item.label,
    item.maximum.toFixed(2),
    item.timezone,
    `${item.visible}`,
    String(item.sendAt),
    item.region,
    text.truncate(item.phone, 120),
    text.truncate(item.locale, 80),
    item.channel,
    String(item.revision),
    `${item.status}`.toUpperCase(),
  );
}

export function toLegacyOptOutSegmentViews(items: LegacyOptOutSegment[]): LegacyOptOutSegmentView[] {
  const views: LegacyOptOutSegmentView[] = [];
  for (const item of items) {
    views.push(toLegacyOptOutSegmentView(item));
  }
  return views;
}

export function sumLegacyOptOutSegmentView(view: LegacyOptOutSegmentView): number {
  const parsedMaximum = Number(view.maximum);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximum} is not a number`);
  const parsedSendAt = Number(view.sendAtText);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAtText} is not a number`);
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  return parsedMaximum + parsedSendAt + parsedRevision;
}
