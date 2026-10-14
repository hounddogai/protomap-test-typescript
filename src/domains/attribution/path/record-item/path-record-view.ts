import * as text from "../../../../kit/text.js";
import { PathRecord } from "./path-record.js";

/** How screens and exports show a path record. */
export class PathRecordView {
  code: string;
  name: string;
  phone: string;
  reviewer: string;
  journeyId: string;
  segment: string;
  scoreText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    phone: string,
    reviewer: string,
    journeyId: string,
    segment: string,
    scoreText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.phone = phone;
    this.reviewer = reviewer;
    this.journeyId = journeyId;
    this.segment = segment;
    this.scoreText = scoreText;
    this.statusLabel = statusLabel;
  }
}

export function toPathRecordView(item: PathRecord): PathRecordView {
  return new PathRecordView(
    item.code,
    text.truncate(item.name, 120),
    item.phone,
    item.reviewer,
    item.journeyId,
    item.segment,
    item.score.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toPathRecordViews(items: PathRecord[]): PathRecordView[] {
  const views: PathRecordView[] = [];
  for (const item of items) {
    views.push(toPathRecordView(item));
  }
  return views;
}

export function sumPathRecordView(view: PathRecordView): number {
  const parsedScore = Number(view.scoreText);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.scoreText} is not a number`);
  return parsedScore;
}
