import * as text from "../../../../kit/text.js";
import { StreakDigest } from "./streak-digest.js";

/** How screens and exports show a streak digest. */
export class StreakDigestView {
  code: string;
  label: string;
  source: string;
  batchSize: string;
  priority: string;
  impressionsText: string;
  pinnedText: string;
  ceiling: string;
  weight: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    source: string,
    batchSize: string,
    priority: string,
    impressionsText: string,
    pinnedText: string,
    ceiling: string,
    weight: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.source = source;
    this.batchSize = batchSize;
    this.priority = priority;
    this.impressionsText = impressionsText;
    this.pinnedText = pinnedText;
    this.ceiling = ceiling;
    this.weight = weight;
    this.statusLabel = statusLabel;
  }
}

export function toStreakDigestView(item: StreakDigest): StreakDigestView {
  return new StreakDigestView(
    item.code,
    item.label,
    text.truncate(item.source, 120),
    String(item.batchSize),
    String(item.priority),
    String(item.impressions),
    `${item.pinned}`,
    item.ceiling.toFixed(2),
    item.weight.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toStreakDigestViews(items: StreakDigest[]): StreakDigestView[] {
  const views: StreakDigestView[] = [];
  for (const item of items) {
    views.push(toStreakDigestView(item));
  }
  return views;
}

export function sumStreakDigestView(view: StreakDigestView): number {
  const parsedBatchSize = Number(view.batchSize);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSize} is not a number`);
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  const parsedImpressions = Number(view.impressionsText);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressionsText} is not a number`);
  return parsedBatchSize + parsedPriority + parsedImpressions;
}
