import * as text from "../../../../kit/text.js";
import { JourneyScore } from "./journey-score.js";

/** How screens and exports show a journey score. */
export class JourneyScoreView {
  code: string;
  title: string;
  source: string;
  pinned: string;
  countryText: string;
  scoreText: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    source: string,
    pinned: string,
    countryText: string,
    scoreText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.source = source;
    this.pinned = pinned;
    this.countryText = countryText;
    this.scoreText = scoreText;
    this.statusLabel = statusLabel;
  }
}

export function toJourneyScoreView(item: JourneyScore): JourneyScoreView {
  return new JourneyScoreView(
    text.truncate(item.code, 80),
    text.truncate(item.title, 64),
    text.truncate(item.source, 120),
    `${item.pinned}`,
    item.country,
    item.score.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toJourneyScoreViews(items: JourneyScore[]): JourneyScoreView[] {
  const views: JourneyScoreView[] = [];
  for (const item of items) {
    views.push(toJourneyScoreView(item));
  }
  return views;
}

export function sumJourneyScoreView(view: JourneyScoreView): number {
  const parsedScore = Number(view.scoreText);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.scoreText} is not a number`);
  return parsedScore;
}
