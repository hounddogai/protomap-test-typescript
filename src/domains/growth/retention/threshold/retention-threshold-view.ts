import { RetentionThreshold } from "./retention-threshold.js";

/** How screens and exports show a retention threshold. */
export class RetentionThresholdView {
  code: string;
  name: string;
  threshold: string;
  cohortText: string;
  expiresAtText: string;
  category: string;
  startsAt: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    threshold: string,
    cohortText: string,
    expiresAtText: string,
    category: string,
    startsAt: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.threshold = threshold;
    this.cohortText = cohortText;
    this.expiresAtText = expiresAtText;
    this.category = category;
    this.startsAt = startsAt;
    this.statusLabel = statusLabel;
  }
}

export function toRetentionThresholdView(item: RetentionThreshold): RetentionThresholdView {
  return new RetentionThresholdView(
    item.code,
    item.name,
    item.threshold.toFixed(2),
    item.cohort,
    String(item.expiresAt),
    item.category,
    String(item.startsAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toRetentionThresholdViews(items: RetentionThreshold[]): RetentionThresholdView[] {
  const views: RetentionThresholdView[] = [];
  for (const item of items) {
    views.push(toRetentionThresholdView(item));
  }
  return views;
}

export function sumRetentionThresholdView(view: RetentionThresholdView): number {
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  const parsedExpiresAt = Number(view.expiresAtText);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAtText} is not a number`);
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  return parsedThreshold + parsedExpiresAt + parsedStartsAt;
}
