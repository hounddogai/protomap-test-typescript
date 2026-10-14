import { BatchedRetentionSegment } from "./batched-retention-segment.js";

/** How screens and exports show a batched retention segment. */
export class BatchedRetentionSegmentView {
  code: string;
  name: string;
  description: string;
  summary: string;
  category: string;
  approved: string;
  durationMinutes: string;
  margin: string;
  versionText: string;
  sendAt: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    description: string,
    summary: string,
    category: string,
    approved: string,
    durationMinutes: string,
    margin: string,
    versionText: string,
    sendAt: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.description = description;
    this.summary = summary;
    this.category = category;
    this.approved = approved;
    this.durationMinutes = durationMinutes;
    this.margin = margin;
    this.versionText = versionText;
    this.sendAt = sendAt;
    this.statusLabel = statusLabel;
  }
}

export function toBatchedRetentionSegmentView(item: BatchedRetentionSegment): BatchedRetentionSegmentView {
  return new BatchedRetentionSegmentView(
    item.code,
    item.name,
    item.description,
    item.summary,
    item.category,
    `${item.approved}`,
    String(item.durationMinutes),
    item.margin.toFixed(2),
    String(item.version),
    String(item.sendAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toBatchedRetentionSegmentViews(items: BatchedRetentionSegment[]): BatchedRetentionSegmentView[] {
  const views: BatchedRetentionSegmentView[] = [];
  for (const item of items) {
    views.push(toBatchedRetentionSegmentView(item));
  }
  return views;
}

export function sumBatchedRetentionSegmentView(view: BatchedRetentionSegmentView): number {
  const parsedDurationMinutes = Number(view.durationMinutes);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutes} is not a number`);
  const parsedMargin = Number(view.margin);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.margin} is not a number`);
  const parsedVersion = Number(view.versionText);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.versionText} is not a number`);
  return parsedDurationMinutes + parsedMargin + parsedVersion;
}
