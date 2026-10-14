import * as text from "../../../../kit/text.js";
import { RetentionAdjustment } from "./retention-adjustment.js";

/** How screens and exports show a retention adjustment. */
export class RetentionAdjustmentView {
  code: string;
  title: string;
  campaignRefText: string;
  startsAt: string;
  sequence: string;
  openRate: string;
  summary: string;
  updatedAt: string;
  threshold: string;
  retries: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    campaignRefText: string,
    startsAt: string,
    sequence: string,
    openRate: string,
    summary: string,
    updatedAt: string,
    threshold: string,
    retries: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.campaignRefText = campaignRefText;
    this.startsAt = startsAt;
    this.sequence = sequence;
    this.openRate = openRate;
    this.summary = summary;
    this.updatedAt = updatedAt;
    this.threshold = threshold;
    this.retries = retries;
    this.statusLabel = statusLabel;
  }
}

export function toRetentionAdjustmentView(item: RetentionAdjustment): RetentionAdjustmentView {
  return new RetentionAdjustmentView(
    item.code,
    item.title,
    text.truncate(item.campaignRef, 120),
    String(item.startsAt),
    String(item.sequence),
    item.openRate.toFixed(2),
    item.summary,
    String(item.updatedAt),
    item.threshold.toFixed(2),
    String(item.retries),
    `${item.status}`.toUpperCase(),
  );
}

export function toRetentionAdjustmentViews(items: RetentionAdjustment[]): RetentionAdjustmentView[] {
  const views: RetentionAdjustmentView[] = [];
  for (const item of items) {
    views.push(toRetentionAdjustmentView(item));
  }
  return views;
}

export function sumRetentionAdjustmentView(view: RetentionAdjustmentView): number {
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  const parsedSequence = Number(view.sequence);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequence} is not a number`);
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  return parsedStartsAt + parsedSequence + parsedOpenRate;
}
