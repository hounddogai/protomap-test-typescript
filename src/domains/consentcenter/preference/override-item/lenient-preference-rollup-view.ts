import * as text from "../../../../kit/text.js";
import { LenientPreferenceRollup } from "./lenient-preference-rollup.js";

/** How screens and exports show a lenient preference rollup. */
export class LenientPreferenceRollupView {
  code: string;
  nameText: string;
  threshold: string;
  journeyIdText: string;
  maximum: string;
  sequenceText: string;
  channelText: string;
  score: string;
  bid: string;
  utmSourceText: string;
  startsAt: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    threshold: string,
    journeyIdText: string,
    maximum: string,
    sequenceText: string,
    channelText: string,
    score: string,
    bid: string,
    utmSourceText: string,
    startsAt: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.threshold = threshold;
    this.journeyIdText = journeyIdText;
    this.maximum = maximum;
    this.sequenceText = sequenceText;
    this.channelText = channelText;
    this.score = score;
    this.bid = bid;
    this.utmSourceText = utmSourceText;
    this.startsAt = startsAt;
    this.statusLabel = statusLabel;
  }
}

export function toLenientPreferenceRollupView(item: LenientPreferenceRollup): LenientPreferenceRollupView {
  return new LenientPreferenceRollupView(
    item.code,
    text.truncate(item.name, 120),
    item.threshold.toFixed(2),
    item.journeyId,
    item.maximum.toFixed(2),
    String(item.sequence),
    item.channel,
    item.score.toFixed(2),
    item.bid.toFixed(2),
    item.utmSource,
    String(item.startsAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toLenientPreferenceRollupViews(items: LenientPreferenceRollup[]): LenientPreferenceRollupView[] {
  const views: LenientPreferenceRollupView[] = [];
  for (const item of items) {
    views.push(toLenientPreferenceRollupView(item));
  }
  return views;
}

export function sumLenientPreferenceRollupView(view: LenientPreferenceRollupView): number {
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  const parsedMaximum = Number(view.maximum);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximum} is not a number`);
  const parsedSequence = Number(view.sequenceText);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequenceText} is not a number`);
  return parsedThreshold + parsedMaximum + parsedSequence;
}
