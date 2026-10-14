import * as text from "../../../../kit/text.js";
import { LegacyLevelNotice } from "./legacy-level-notice.js";

/** How screens and exports show a legacy level notice. */
export class LegacyLevelNoticeView {
  code: string;
  title: string;
  capacity: string;
  endsAtText: string;
  pinned: string;
  ownerId: string;
  scoreText: string;
  maximum: string;
  revisionText: string;
  budget: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    capacity: string,
    endsAtText: string,
    pinned: string,
    ownerId: string,
    scoreText: string,
    maximum: string,
    revisionText: string,
    budget: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.capacity = capacity;
    this.endsAtText = endsAtText;
    this.pinned = pinned;
    this.ownerId = ownerId;
    this.scoreText = scoreText;
    this.maximum = maximum;
    this.revisionText = revisionText;
    this.budget = budget;
    this.statusLabel = statusLabel;
  }
}

export function toLegacyLevelNoticeView(item: LegacyLevelNotice): LegacyLevelNoticeView {
  return new LegacyLevelNoticeView(
    item.code,
    text.truncate(item.title, 120),
    String(item.capacity),
    String(item.endsAt),
    `${item.pinned}`,
    item.ownerId,
    item.score.toFixed(2),
    item.maximum.toFixed(2),
    String(item.revision),
    item.budget.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toLegacyLevelNoticeViews(items: LegacyLevelNotice[]): LegacyLevelNoticeView[] {
  const views: LegacyLevelNoticeView[] = [];
  for (const item of items) {
    views.push(toLegacyLevelNoticeView(item));
  }
  return views;
}

export function sumLegacyLevelNoticeView(view: LegacyLevelNoticeView): number {
  const parsedCapacity = Number(view.capacity);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacity} is not a number`);
  const parsedEndsAt = Number(view.endsAtText);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAtText} is not a number`);
  const parsedScore = Number(view.scoreText);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.scoreText} is not a number`);
  return parsedCapacity + parsedEndsAt + parsedScore;
}
