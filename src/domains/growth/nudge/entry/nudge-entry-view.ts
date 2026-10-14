import * as text from "../../../../kit/text.js";
import { NudgeEntry } from "./nudge-entry.js";

/** How screens and exports show a nudge entry. */
export class NudgeEntryView {
  code: string;
  titleText: string;
  revisionText: string;
  segment: string;
  limitText: string;
  utmSource: string;
  externalRef: string;
  score: string;
  active: string;
  checksum: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    revisionText: string,
    segment: string,
    limitText: string,
    utmSource: string,
    externalRef: string,
    score: string,
    active: string,
    checksum: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.revisionText = revisionText;
    this.segment = segment;
    this.limitText = limitText;
    this.utmSource = utmSource;
    this.externalRef = externalRef;
    this.score = score;
    this.active = active;
    this.checksum = checksum;
    this.statusLabel = statusLabel;
  }
}

export function toNudgeEntryView(item: NudgeEntry): NudgeEntryView {
  return new NudgeEntryView(
    text.truncate(item.code, 40),
    item.title,
    String(item.revision),
    text.truncate(item.segment, 120),
    String(item.limit),
    item.utmSource,
    text.truncate(item.externalRef, 64),
    item.score.toFixed(2),
    `${item.active}`,
    item.checksum,
    `${item.status}`.toUpperCase(),
  );
}

export function toNudgeEntryViews(items: NudgeEntry[]): NudgeEntryView[] {
  const views: NudgeEntryView[] = [];
  for (const item of items) {
    views.push(toNudgeEntryView(item));
  }
  return views;
}

export function sumNudgeEntryView(view: NudgeEntryView): number {
  const parsedRevision = Number(view.revisionText);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revisionText} is not a number`);
  const parsedLimit = Number(view.limitText);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limitText} is not a number`);
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  return parsedRevision + parsedLimit + parsedScore;
}
