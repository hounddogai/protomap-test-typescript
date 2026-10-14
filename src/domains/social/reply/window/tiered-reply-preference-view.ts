import * as text from "../../../../kit/text.js";
import { TieredReplyPreference } from "./tiered-reply-preference.js";

/** How screens and exports show a tiered reply preference. */
export class TieredReplyPreferenceView {
  code: string;
  name: string;
  startsAt: string;
  unit: string;
  sequence: string;
  scoreText: string;
  audienceIdText: string;
  floorValue: string;
  source: string;
  thresholdText: string;
  segment: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    startsAt: string,
    unit: string,
    sequence: string,
    scoreText: string,
    audienceIdText: string,
    floorValue: string,
    source: string,
    thresholdText: string,
    segment: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.startsAt = startsAt;
    this.unit = unit;
    this.sequence = sequence;
    this.scoreText = scoreText;
    this.audienceIdText = audienceIdText;
    this.floorValue = floorValue;
    this.source = source;
    this.thresholdText = thresholdText;
    this.segment = segment;
    this.statusLabel = statusLabel;
  }
}

export function toTieredReplyPreferenceView(item: TieredReplyPreference): TieredReplyPreferenceView {
  return new TieredReplyPreferenceView(
    text.truncate(item.code, 80),
    item.name,
    String(item.startsAt),
    text.truncate(item.unit, 64),
    String(item.sequence),
    item.score.toFixed(2),
    item.audienceId,
    item.floorValue.toFixed(2),
    item.source,
    item.threshold.toFixed(2),
    item.segment,
    `${item.status}`.toUpperCase(),
  );
}

export function toTieredReplyPreferenceViews(items: TieredReplyPreference[]): TieredReplyPreferenceView[] {
  const views: TieredReplyPreferenceView[] = [];
  for (const item of items) {
    views.push(toTieredReplyPreferenceView(item));
  }
  return views;
}

export function sumTieredReplyPreferenceView(view: TieredReplyPreferenceView): number {
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  const parsedSequence = Number(view.sequence);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequence} is not a number`);
  const parsedScore = Number(view.scoreText);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.scoreText} is not a number`);
  return parsedStartsAt + parsedSequence + parsedScore;
}
