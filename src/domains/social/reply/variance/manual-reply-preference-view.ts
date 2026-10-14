import * as text from "../../../../kit/text.js";
import { ManualReplyPreference } from "./manual-reply-preference.js";

/** How screens and exports show a manual reply preference. */
export class ManualReplyPreferenceView {
  code: string;
  nameText: string;
  capacityText: string;
  score: string;
  externalRef: string;
  expiresAt: string;
  clicks: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    capacityText: string,
    score: string,
    externalRef: string,
    expiresAt: string,
    clicks: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.capacityText = capacityText;
    this.score = score;
    this.externalRef = externalRef;
    this.expiresAt = expiresAt;
    this.clicks = clicks;
    this.statusLabel = statusLabel;
  }
}

export function toManualReplyPreferenceView(item: ManualReplyPreference): ManualReplyPreferenceView {
  return new ManualReplyPreferenceView(
    text.truncate(item.code, 120),
    item.name,
    String(item.capacity),
    item.score.toFixed(2),
    text.truncate(item.externalRef, 80),
    String(item.expiresAt),
    String(item.clicks),
    `${item.status}`.toUpperCase(),
  );
}

export function toManualReplyPreferenceViews(items: ManualReplyPreference[]): ManualReplyPreferenceView[] {
  const views: ManualReplyPreferenceView[] = [];
  for (const item of items) {
    views.push(toManualReplyPreferenceView(item));
  }
  return views;
}

export function sumManualReplyPreferenceView(view: ManualReplyPreferenceView): number {
  const parsedCapacity = Number(view.capacityText);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacityText} is not a number`);
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  const parsedExpiresAt = Number(view.expiresAt);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAt} is not a number`);
  return parsedCapacity + parsedScore + parsedExpiresAt;
}
