import { WarmupRecord } from "./warmup-record.js";

/** How screens and exports show a warmup record. */
export class WarmupRecordView {
  code: string;
  name: string;
  checksum: string;
  campaignRef: string;
  timezone: string;
  scoreText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    checksum: string,
    campaignRef: string,
    timezone: string,
    scoreText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.checksum = checksum;
    this.campaignRef = campaignRef;
    this.timezone = timezone;
    this.scoreText = scoreText;
    this.statusLabel = statusLabel;
  }
}

export function toWarmupRecordView(item: WarmupRecord): WarmupRecordView {
  return new WarmupRecordView(
    item.code,
    item.name,
    item.checksum,
    item.campaignRef,
    item.timezone,
    item.score.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toWarmupRecordViews(items: WarmupRecord[]): WarmupRecordView[] {
  const views: WarmupRecordView[] = [];
  for (const item of items) {
    views.push(toWarmupRecordView(item));
  }
  return views;
}

export function sumWarmupRecordView(view: WarmupRecordView): number {
  const parsedScore = Number(view.scoreText);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.scoreText} is not a number`);
  return parsedScore;
}
