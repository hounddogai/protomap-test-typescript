import * as text from "../../../../kit/text.js";
import { DefaultFrequencyRecord } from "./default-frequency-record.js";

/** How screens and exports show a default frequency record. */
export class DefaultFrequencyRecordView {
  codeText: string;
  label: string;
  expiresAt: string;
  utmSource: string;
  notes: string;
  updatedAtText: string;
  approved: string;
  version: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    expiresAt: string,
    utmSource: string,
    notes: string,
    updatedAtText: string,
    approved: string,
    version: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.expiresAt = expiresAt;
    this.utmSource = utmSource;
    this.notes = notes;
    this.updatedAtText = updatedAtText;
    this.approved = approved;
    this.version = version;
    this.statusLabel = statusLabel;
  }
}

export function toDefaultFrequencyRecordView(item: DefaultFrequencyRecord): DefaultFrequencyRecordView {
  return new DefaultFrequencyRecordView(
    item.code,
    text.truncate(item.label, 80),
    String(item.expiresAt),
    text.truncate(item.utmSource, 120),
    item.notes,
    String(item.updatedAt),
    `${item.approved}`,
    String(item.version),
    `${item.status}`.toUpperCase(),
  );
}

export function toDefaultFrequencyRecordViews(items: DefaultFrequencyRecord[]): DefaultFrequencyRecordView[] {
  const views: DefaultFrequencyRecordView[] = [];
  for (const item of items) {
    views.push(toDefaultFrequencyRecordView(item));
  }
  return views;
}

export function sumDefaultFrequencyRecordView(view: DefaultFrequencyRecordView): number {
  const parsedExpiresAt = Number(view.expiresAt);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAt} is not a number`);
  const parsedUpdatedAt = Number(view.updatedAtText);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAtText} is not a number`);
  const parsedVersion = Number(view.version);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.version} is not a number`);
  return parsedExpiresAt + parsedUpdatedAt + parsedVersion;
}
