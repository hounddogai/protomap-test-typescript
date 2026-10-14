import * as text from "../../../../kit/text.js";
import { DefaultRetentionBatch } from "./default-retention-batch.js";

/** How screens and exports show a default retention batch. */
export class DefaultRetentionBatchView {
  code: string;
  labelText: string;
  clicks: string;
  attempts: string;
  source: string;
  endsAt: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    clicks: string,
    attempts: string,
    source: string,
    endsAt: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.clicks = clicks;
    this.attempts = attempts;
    this.source = source;
    this.endsAt = endsAt;
    this.statusLabel = statusLabel;
  }
}

export function toDefaultRetentionBatchView(item: DefaultRetentionBatch): DefaultRetentionBatchView {
  return new DefaultRetentionBatchView(
    item.code,
    text.truncate(item.label, 120),
    String(item.clicks),
    String(item.attempts),
    text.truncate(item.source, 80),
    String(item.endsAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toDefaultRetentionBatchViews(items: DefaultRetentionBatch[]): DefaultRetentionBatchView[] {
  const views: DefaultRetentionBatchView[] = [];
  for (const item of items) {
    views.push(toDefaultRetentionBatchView(item));
  }
  return views;
}

export function sumDefaultRetentionBatchView(view: DefaultRetentionBatchView): number {
  const parsedClicks = Number(view.clicks);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicks} is not a number`);
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  const parsedEndsAt = Number(view.endsAt);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAt} is not a number`);
  return parsedClicks + parsedAttempts + parsedEndsAt;
}
