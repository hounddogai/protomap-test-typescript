import * as text from "../../../../kit/text.js";
import { InsightScore } from "./insight-score.js";

/** How screens and exports show a insight score. */
export class InsightScoreView {
  code: string;
  title: string;
  openRate: string;
  unit: string;
  regionText: string;
  score: string;
  ceilingText: string;
  limit: string;
  segment: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    openRate: string,
    unit: string,
    regionText: string,
    score: string,
    ceilingText: string,
    limit: string,
    segment: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.openRate = openRate;
    this.unit = unit;
    this.regionText = regionText;
    this.score = score;
    this.ceilingText = ceilingText;
    this.limit = limit;
    this.segment = segment;
    this.statusLabel = statusLabel;
  }
}

export function toInsightScoreView(item: InsightScore): InsightScoreView {
  return new InsightScoreView(
    item.code,
    item.title,
    item.openRate.toFixed(2),
    item.unit,
    text.truncate(item.region, 40),
    item.score.toFixed(2),
    item.ceiling.toFixed(2),
    String(item.limit),
    item.segment,
    `${item.status}`.toUpperCase(),
  );
}

export function toInsightScoreViews(items: InsightScore[]): InsightScoreView[] {
  const views: InsightScoreView[] = [];
  for (const item of items) {
    views.push(toInsightScoreView(item));
  }
  return views;
}

export function sumInsightScoreView(view: InsightScoreView): number {
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  const parsedCeiling = Number(view.ceilingText);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceilingText} is not a number`);
  return parsedOpenRate + parsedScore + parsedCeiling;
}
