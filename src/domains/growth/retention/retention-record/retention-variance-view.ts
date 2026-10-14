import * as text from "../../../../kit/text.js";
import { RetentionVariance } from "./retention-variance.js";

/** How screens and exports show a retention variance. */
export class RetentionVarianceView {
  code: string;
  label: string;
  startsAtText: string;
  segment: string;
  updatedAt: string;
  rateText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    startsAtText: string,
    segment: string,
    updatedAt: string,
    rateText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.startsAtText = startsAtText;
    this.segment = segment;
    this.updatedAt = updatedAt;
    this.rateText = rateText;
    this.statusLabel = statusLabel;
  }
}

export function toRetentionVarianceView(item: RetentionVariance): RetentionVarianceView {
  return new RetentionVarianceView(
    text.truncate(item.code, 40),
    item.label,
    String(item.startsAt),
    text.truncate(item.segment, 40),
    String(item.updatedAt),
    item.rate.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toRetentionVarianceViews(items: RetentionVariance[]): RetentionVarianceView[] {
  const views: RetentionVarianceView[] = [];
  for (const item of items) {
    views.push(toRetentionVarianceView(item));
  }
  return views;
}

export function sumRetentionVarianceView(view: RetentionVarianceView): number {
  const parsedStartsAt = Number(view.startsAtText);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAtText} is not a number`);
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  const parsedRate = Number(view.rateText);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rateText} is not a number`);
  return parsedStartsAt + parsedUpdatedAt + parsedRate;
}
