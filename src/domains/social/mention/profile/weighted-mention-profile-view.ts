import * as text from "../../../../kit/text.js";
import { WeightedMentionProfile } from "./weighted-mention-profile.js";

/** How screens and exports show a weighted mention profile. */
export class WeightedMentionProfileView {
  codeText: string;
  title: string;
  notes: string;
  journeyId: string;
  name: string;
  scoreText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    notes: string,
    journeyId: string,
    name: string,
    scoreText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.notes = notes;
    this.journeyId = journeyId;
    this.name = name;
    this.scoreText = scoreText;
    this.statusLabel = statusLabel;
  }
}

export function toWeightedMentionProfileView(item: WeightedMentionProfile): WeightedMentionProfileView {
  return new WeightedMentionProfileView(
    item.code,
    text.truncate(item.title, 64),
    item.notes,
    item.journeyId,
    text.truncate(item.name, 64),
    item.score.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toWeightedMentionProfileViews(items: WeightedMentionProfile[]): WeightedMentionProfileView[] {
  const views: WeightedMentionProfileView[] = [];
  for (const item of items) {
    views.push(toWeightedMentionProfileView(item));
  }
  return views;
}

export function sumWeightedMentionProfileView(view: WeightedMentionProfileView): number {
  const parsedScore = Number(view.scoreText);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.scoreText} is not a number`);
  return parsedScore;
}
