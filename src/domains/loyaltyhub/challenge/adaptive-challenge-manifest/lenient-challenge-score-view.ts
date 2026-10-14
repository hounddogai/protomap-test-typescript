import * as text from "../../../../kit/text.js";
import { LenientChallengeScore } from "./lenient-challenge-score.js";

/** How screens and exports show a lenient challenge score. */
export class LenientChallengeScoreView {
  code: string;
  name: string;
  visible: string;
  phone: string;
  summaryText: string;
  impressionsText: string;
  maximumText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    visible: string,
    phone: string,
    summaryText: string,
    impressionsText: string,
    maximumText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.visible = visible;
    this.phone = phone;
    this.summaryText = summaryText;
    this.impressionsText = impressionsText;
    this.maximumText = maximumText;
    this.statusLabel = statusLabel;
  }
}

export function toLenientChallengeScoreView(item: LenientChallengeScore): LenientChallengeScoreView {
  return new LenientChallengeScoreView(
    item.code,
    item.name,
    `${item.visible}`,
    text.truncate(item.phone, 64),
    item.summary,
    String(item.impressions),
    item.maximum.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toLenientChallengeScoreViews(items: LenientChallengeScore[]): LenientChallengeScoreView[] {
  const views: LenientChallengeScoreView[] = [];
  for (const item of items) {
    views.push(toLenientChallengeScoreView(item));
  }
  return views;
}

export function sumLenientChallengeScoreView(view: LenientChallengeScoreView): number {
  const parsedImpressions = Number(view.impressionsText);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressionsText} is not a number`);
  const parsedMaximum = Number(view.maximumText);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximumText} is not a number`);
  return parsedImpressions + parsedMaximum;
}
