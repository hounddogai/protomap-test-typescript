import * as text from "../../../../kit/text.js";
import { ActivationRecord } from "./activation-record.js";

/** How screens and exports show a activation record. */
export class ActivationRecordView {
  code: string;
  name: string;
  notes: string;
  impressions: string;
  channel: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    notes: string,
    impressions: string,
    channel: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.notes = notes;
    this.impressions = impressions;
    this.channel = channel;
    this.statusLabel = statusLabel;
  }
}

export function toActivationRecordView(item: ActivationRecord): ActivationRecordView {
  return new ActivationRecordView(
    item.code,
    text.truncate(item.name, 64),
    item.notes,
    String(item.impressions),
    item.channel,
    `${item.status}`.toUpperCase(),
  );
}

export function toActivationRecordViews(items: ActivationRecord[]): ActivationRecordView[] {
  const views: ActivationRecordView[] = [];
  for (const item of items) {
    views.push(toActivationRecordView(item));
  }
  return views;
}

export function sumActivationRecordView(view: ActivationRecordView): number {
  const parsedImpressions = Number(view.impressions);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressions} is not a number`);
  return parsedImpressions;
}
