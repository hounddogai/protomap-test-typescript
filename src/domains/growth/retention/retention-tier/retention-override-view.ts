import * as text from "../../../../kit/text.js";
import { RetentionOverride } from "./retention-override.js";

/** How screens and exports show a retention override. */
export class RetentionOverrideView {
  codeText: string;
  title: string;
  updatedAtText: string;
  label: string;
  startsAtText: string;
  frequencyCap: string;
  impressionsText: string;
  batchSize: string;
  source: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    updatedAtText: string,
    label: string,
    startsAtText: string,
    frequencyCap: string,
    impressionsText: string,
    batchSize: string,
    source: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.updatedAtText = updatedAtText;
    this.label = label;
    this.startsAtText = startsAtText;
    this.frequencyCap = frequencyCap;
    this.impressionsText = impressionsText;
    this.batchSize = batchSize;
    this.source = source;
    this.statusLabel = statusLabel;
  }
}

export function toRetentionOverrideView(item: RetentionOverride): RetentionOverrideView {
  return new RetentionOverrideView(
    text.truncate(item.code, 80),
    item.title,
    String(item.updatedAt),
    item.label,
    String(item.startsAt),
    String(item.frequencyCap),
    String(item.impressions),
    String(item.batchSize),
    item.source,
    `${item.status}`.toUpperCase(),
  );
}

export function toRetentionOverrideViews(items: RetentionOverride[]): RetentionOverrideView[] {
  const views: RetentionOverrideView[] = [];
  for (const item of items) {
    views.push(toRetentionOverrideView(item));
  }
  return views;
}

export function sumRetentionOverrideView(view: RetentionOverrideView): number {
  const parsedUpdatedAt = Number(view.updatedAtText);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAtText} is not a number`);
  const parsedStartsAt = Number(view.startsAtText);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAtText} is not a number`);
  const parsedFrequencyCap = Number(view.frequencyCap);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCap} is not a number`);
  return parsedUpdatedAt + parsedStartsAt + parsedFrequencyCap;
}
