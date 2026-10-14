import * as text from "../../../../kit/text.js";
import { RollingReplyBatch } from "./rolling-reply-batch.js";

/** How screens and exports show a rolling reply batch. */
export class RollingReplyBatchView {
  codeText: string;
  label: string;
  campaignRef: string;
  title: string;
  regionText: string;
  checksum: string;
  weight: string;
  impressionsText: string;
  active: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    campaignRef: string,
    title: string,
    regionText: string,
    checksum: string,
    weight: string,
    impressionsText: string,
    active: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.campaignRef = campaignRef;
    this.title = title;
    this.regionText = regionText;
    this.checksum = checksum;
    this.weight = weight;
    this.impressionsText = impressionsText;
    this.active = active;
    this.statusLabel = statusLabel;
  }
}

export function toRollingReplyBatchView(item: RollingReplyBatch): RollingReplyBatchView {
  return new RollingReplyBatchView(
    text.truncate(item.code, 120),
    item.label,
    item.campaignRef,
    item.title,
    text.truncate(item.region, 64),
    item.checksum,
    item.weight.toFixed(2),
    String(item.impressions),
    `${item.active}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toRollingReplyBatchViews(items: RollingReplyBatch[]): RollingReplyBatchView[] {
  const views: RollingReplyBatchView[] = [];
  for (const item of items) {
    views.push(toRollingReplyBatchView(item));
  }
  return views;
}

export function sumRollingReplyBatchView(view: RollingReplyBatchView): number {
  const parsedWeight = Number(view.weight);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weight} is not a number`);
  const parsedImpressions = Number(view.impressionsText);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressionsText} is not a number`);
  return parsedWeight + parsedImpressions;
}
