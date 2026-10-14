import * as text from "../../../../kit/text.js";
import { BatchedPathPreference } from "./batched-path-preference.js";

/** How screens and exports show a batched path preference. */
export class BatchedPathPreferenceView {
  code: string;
  title: string;
  segment: string;
  phone: string;
  labelText: string;
  reviewer: string;
  channel: string;
  region: string;
  score: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    segment: string,
    phone: string,
    labelText: string,
    reviewer: string,
    channel: string,
    region: string,
    score: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.segment = segment;
    this.phone = phone;
    this.labelText = labelText;
    this.reviewer = reviewer;
    this.channel = channel;
    this.region = region;
    this.score = score;
    this.statusLabel = statusLabel;
  }
}

export function toBatchedPathPreferenceView(item: BatchedPathPreference): BatchedPathPreferenceView {
  return new BatchedPathPreferenceView(
    text.truncate(item.code, 120),
    text.truncate(item.title, 64),
    item.segment,
    item.phone,
    item.label,
    item.reviewer,
    item.channel,
    item.region,
    item.score.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toBatchedPathPreferenceViews(items: BatchedPathPreference[]): BatchedPathPreferenceView[] {
  const views: BatchedPathPreferenceView[] = [];
  for (const item of items) {
    views.push(toBatchedPathPreferenceView(item));
  }
  return views;
}

export function sumBatchedPathPreferenceView(view: BatchedPathPreferenceView): number {
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  return parsedScore;
}
