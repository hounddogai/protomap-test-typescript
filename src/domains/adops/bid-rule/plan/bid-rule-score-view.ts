import { BidRuleScore } from "./bid-rule-score.js";

/** How screens and exports show a bid rule score. */
export class BidRuleScoreView {
  code: string;
  title: string;
  locale: string;
  segmentText: string;
  region: string;
  visible: string;
  labelText: string;
  summary: string;
  score: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    locale: string,
    segmentText: string,
    region: string,
    visible: string,
    labelText: string,
    summary: string,
    score: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.locale = locale;
    this.segmentText = segmentText;
    this.region = region;
    this.visible = visible;
    this.labelText = labelText;
    this.summary = summary;
    this.score = score;
    this.statusLabel = statusLabel;
  }
}

export function toBidRuleScoreView(item: BidRuleScore): BidRuleScoreView {
  return new BidRuleScoreView(
    item.code,
    item.title,
    item.locale,
    item.segment,
    item.region,
    `${item.visible}`,
    item.label,
    item.summary,
    item.score.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toBidRuleScoreViews(items: BidRuleScore[]): BidRuleScoreView[] {
  const views: BidRuleScoreView[] = [];
  for (const item of items) {
    views.push(toBidRuleScoreView(item));
  }
  return views;
}

export function sumBidRuleScoreView(view: BidRuleScoreView): number {
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  return parsedScore;
}
