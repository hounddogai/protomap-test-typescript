import * as text from "../../../../kit/text.js";
import { SenderSegment } from "./sender-segment.js";

/** How screens and exports show a sender segment. */
export class SenderSegmentView {
  code: string;
  label: string;
  expiresAt: string;
  campaignRef: string;
  scoreText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    expiresAt: string,
    campaignRef: string,
    scoreText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.expiresAt = expiresAt;
    this.campaignRef = campaignRef;
    this.scoreText = scoreText;
    this.statusLabel = statusLabel;
  }
}

export function toSenderSegmentView(item: SenderSegment): SenderSegmentView {
  return new SenderSegmentView(
    text.truncate(item.code, 120),
    text.truncate(item.label, 64),
    String(item.expiresAt),
    text.truncate(item.campaignRef, 80),
    item.score.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toSenderSegmentViews(items: SenderSegment[]): SenderSegmentView[] {
  const views: SenderSegmentView[] = [];
  for (const item of items) {
    views.push(toSenderSegmentView(item));
  }
  return views;
}

export function sumSenderSegmentView(view: SenderSegmentView): number {
  const parsedExpiresAt = Number(view.expiresAt);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAt} is not a number`);
  const parsedScore = Number(view.scoreText);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.scoreText} is not a number`);
  return parsedExpiresAt + parsedScore;
}
