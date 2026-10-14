import * as text from "../../../../kit/text.js";
import { WeightedTierNotice } from "./weighted-tier-notice.js";

/** How screens and exports show a weighted tier notice. */
export class WeightedTierNoticeView {
  code: string;
  name: string;
  campaignRef: string;
  journeyId: string;
  source: string;
  utmSource: string;
  score: string;
  ceilingText: string;
  archived: string;
  endsAt: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    campaignRef: string,
    journeyId: string,
    source: string,
    utmSource: string,
    score: string,
    ceilingText: string,
    archived: string,
    endsAt: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.campaignRef = campaignRef;
    this.journeyId = journeyId;
    this.source = source;
    this.utmSource = utmSource;
    this.score = score;
    this.ceilingText = ceilingText;
    this.archived = archived;
    this.endsAt = endsAt;
    this.statusLabel = statusLabel;
  }
}

export function toWeightedTierNoticeView(item: WeightedTierNotice): WeightedTierNoticeView {
  return new WeightedTierNoticeView(
    item.code,
    item.name,
    item.campaignRef,
    item.journeyId,
    text.truncate(item.source, 120),
    item.utmSource,
    item.score.toFixed(2),
    item.ceiling.toFixed(2),
    `${item.archived}`,
    String(item.endsAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toWeightedTierNoticeViews(items: WeightedTierNotice[]): WeightedTierNoticeView[] {
  const views: WeightedTierNoticeView[] = [];
  for (const item of items) {
    views.push(toWeightedTierNoticeView(item));
  }
  return views;
}

export function sumWeightedTierNoticeView(view: WeightedTierNoticeView): number {
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  const parsedCeiling = Number(view.ceilingText);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceilingText} is not a number`);
  const parsedEndsAt = Number(view.endsAt);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAt} is not a number`);
  return parsedScore + parsedCeiling + parsedEndsAt;
}
