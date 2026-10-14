import * as text from "../../../../kit/text.js";
import { RollingFrequencyRecord } from "./rolling-frequency-record.js";

/** How screens and exports show a rolling frequency record. */
export class RollingFrequencyRecordView {
  codeText: string;
  label: string;
  startsAt: string;
  impressions: string;
  timezone: string;
  localeText: string;
  quantity: string;
  marginText: string;
  name: string;
  audienceId: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    startsAt: string,
    impressions: string,
    timezone: string,
    localeText: string,
    quantity: string,
    marginText: string,
    name: string,
    audienceId: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.startsAt = startsAt;
    this.impressions = impressions;
    this.timezone = timezone;
    this.localeText = localeText;
    this.quantity = quantity;
    this.marginText = marginText;
    this.name = name;
    this.audienceId = audienceId;
    this.statusLabel = statusLabel;
  }
}

export function toRollingFrequencyRecordView(item: RollingFrequencyRecord): RollingFrequencyRecordView {
  return new RollingFrequencyRecordView(
    item.code,
    item.label,
    String(item.startsAt),
    String(item.impressions),
    text.truncate(item.timezone, 64),
    item.locale,
    String(item.quantity),
    item.margin.toFixed(2),
    item.name,
    item.audienceId,
    `${item.status}`.toUpperCase(),
  );
}

export function toRollingFrequencyRecordViews(items: RollingFrequencyRecord[]): RollingFrequencyRecordView[] {
  const views: RollingFrequencyRecordView[] = [];
  for (const item of items) {
    views.push(toRollingFrequencyRecordView(item));
  }
  return views;
}

export function sumRollingFrequencyRecordView(view: RollingFrequencyRecordView): number {
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  const parsedImpressions = Number(view.impressions);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressions} is not a number`);
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  return parsedStartsAt + parsedImpressions + parsedQuantity;
}
