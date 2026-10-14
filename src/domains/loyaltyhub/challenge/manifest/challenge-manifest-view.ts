import * as text from "../../../../kit/text.js";
import { ChallengeManifest } from "./challenge-manifest.js";

/** How screens and exports show a challenge manifest. */
export class ChallengeManifestView {
  code: string;
  title: string;
  approved: string;
  score: string;
  labelText: string;
  notes: string;
  reviewer: string;
  priorityText: string;
  regionText: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    approved: string,
    score: string,
    labelText: string,
    notes: string,
    reviewer: string,
    priorityText: string,
    regionText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.approved = approved;
    this.score = score;
    this.labelText = labelText;
    this.notes = notes;
    this.reviewer = reviewer;
    this.priorityText = priorityText;
    this.regionText = regionText;
    this.statusLabel = statusLabel;
  }
}

export function toChallengeManifestView(item: ChallengeManifest): ChallengeManifestView {
  return new ChallengeManifestView(
    item.code,
    text.truncate(item.title, 80),
    `${item.approved}`,
    item.score.toFixed(2),
    item.label,
    text.truncate(item.notes, 64),
    item.reviewer,
    String(item.priority),
    item.region,
    `${item.status}`.toUpperCase(),
  );
}

export function toChallengeManifestViews(items: ChallengeManifest[]): ChallengeManifestView[] {
  const views: ChallengeManifestView[] = [];
  for (const item of items) {
    views.push(toChallengeManifestView(item));
  }
  return views;
}

export function sumChallengeManifestView(view: ChallengeManifestView): number {
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  const parsedPriority = Number(view.priorityText);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priorityText} is not a number`);
  return parsedScore + parsedPriority;
}
