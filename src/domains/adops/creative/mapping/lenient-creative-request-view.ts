import * as text from "../../../../kit/text.js";
import { LenientCreativeRequest } from "./lenient-creative-request.js";

/** How screens and exports show a lenient creative request. */
export class LenientCreativeRequestView {
  code: string;
  labelText: string;
  scoreText: string;
  pinnedText: string;
  reviewerText: string;
  title: string;
  ceiling: string;
  attempts: string;
  ownerId: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    scoreText: string,
    pinnedText: string,
    reviewerText: string,
    title: string,
    ceiling: string,
    attempts: string,
    ownerId: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.scoreText = scoreText;
    this.pinnedText = pinnedText;
    this.reviewerText = reviewerText;
    this.title = title;
    this.ceiling = ceiling;
    this.attempts = attempts;
    this.ownerId = ownerId;
    this.statusLabel = statusLabel;
  }
}

export function toLenientCreativeRequestView(item: LenientCreativeRequest): LenientCreativeRequestView {
  return new LenientCreativeRequestView(
    item.code,
    text.truncate(item.label, 120),
    item.score.toFixed(2),
    `${item.pinned}`,
    text.truncate(item.reviewer, 40),
    text.truncate(item.title, 80),
    item.ceiling.toFixed(2),
    String(item.attempts),
    text.truncate(item.ownerId, 40),
    `${item.status}`.toUpperCase(),
  );
}

export function toLenientCreativeRequestViews(items: LenientCreativeRequest[]): LenientCreativeRequestView[] {
  const views: LenientCreativeRequestView[] = [];
  for (const item of items) {
    views.push(toLenientCreativeRequestView(item));
  }
  return views;
}

export function sumLenientCreativeRequestView(view: LenientCreativeRequestView): number {
  const parsedScore = Number(view.scoreText);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.scoreText} is not a number`);
  const parsedCeiling = Number(view.ceiling);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceiling} is not a number`);
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  return parsedScore + parsedCeiling + parsedAttempts;
}
