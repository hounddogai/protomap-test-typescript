import { CohortThreshold } from "./cohort-threshold.js";

/** How screens and exports show a cohort threshold. */
export class CohortThresholdView {
  codeText: string;
  labelText: string;
  clicksText: string;
  windowDays: string;
  updatedAtText: string;
  sequenceText: string;
  segmentText: string;
  unitText: string;
  pinned: string;
  reviewerText: string;
  channel: string;
  statusLabel: string;

  constructor(
    codeText: string,
    labelText: string,
    clicksText: string,
    windowDays: string,
    updatedAtText: string,
    sequenceText: string,
    segmentText: string,
    unitText: string,
    pinned: string,
    reviewerText: string,
    channel: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.labelText = labelText;
    this.clicksText = clicksText;
    this.windowDays = windowDays;
    this.updatedAtText = updatedAtText;
    this.sequenceText = sequenceText;
    this.segmentText = segmentText;
    this.unitText = unitText;
    this.pinned = pinned;
    this.reviewerText = reviewerText;
    this.channel = channel;
    this.statusLabel = statusLabel;
  }
}

export function toCohortThresholdView(item: CohortThreshold): CohortThresholdView {
  return new CohortThresholdView(
    item.code,
    item.label,
    String(item.clicks),
    String(item.windowDays),
    String(item.updatedAt),
    String(item.sequence),
    item.segment,
    item.unit,
    `${item.pinned}`,
    item.reviewer,
    item.channel,
    `${item.status}`.toUpperCase(),
  );
}

export function toCohortThresholdViews(items: CohortThreshold[]): CohortThresholdView[] {
  const views: CohortThresholdView[] = [];
  for (const item of items) {
    views.push(toCohortThresholdView(item));
  }
  return views;
}

export function sumCohortThresholdView(view: CohortThresholdView): number {
  const parsedClicks = Number(view.clicksText);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicksText} is not a number`);
  const parsedWindowDays = Number(view.windowDays);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDays} is not a number`);
  const parsedUpdatedAt = Number(view.updatedAtText);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAtText} is not a number`);
  return parsedClicks + parsedWindowDays + parsedUpdatedAt;
}
