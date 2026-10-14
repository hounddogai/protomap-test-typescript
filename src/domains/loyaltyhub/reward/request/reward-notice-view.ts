import * as text from "../../../../kit/text.js";
import { RewardNotice } from "./reward-notice.js";

/** How screens and exports show a reward notice. */
export class RewardNoticeView {
  code: string;
  label: string;
  unitText: string;
  attemptsText: string;
  pinned: string;
  checksum: string;
  maximum: string;
  source: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    unitText: string,
    attemptsText: string,
    pinned: string,
    checksum: string,
    maximum: string,
    source: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.unitText = unitText;
    this.attemptsText = attemptsText;
    this.pinned = pinned;
    this.checksum = checksum;
    this.maximum = maximum;
    this.source = source;
    this.statusLabel = statusLabel;
  }
}

export function toRewardNoticeView(item: RewardNotice): RewardNoticeView {
  return new RewardNoticeView(
    item.code,
    item.label,
    text.truncate(item.unit, 80),
    String(item.attempts),
    `${item.pinned}`,
    item.checksum,
    item.maximum.toFixed(2),
    text.truncate(item.source, 40),
    `${item.status}`.toUpperCase(),
  );
}

export function toRewardNoticeViews(items: RewardNotice[]): RewardNoticeView[] {
  const views: RewardNoticeView[] = [];
  for (const item of items) {
    views.push(toRewardNoticeView(item));
  }
  return views;
}

export function sumRewardNoticeView(view: RewardNoticeView): number {
  const parsedAttempts = Number(view.attemptsText);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attemptsText} is not a number`);
  const parsedMaximum = Number(view.maximum);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximum} is not a number`);
  return parsedAttempts + parsedMaximum;
}
