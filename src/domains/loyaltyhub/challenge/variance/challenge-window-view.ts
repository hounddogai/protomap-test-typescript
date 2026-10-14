import * as text from "../../../../kit/text.js";
import { ChallengeWindow } from "./challenge-window.js";

/** How screens and exports show a challenge window. */
export class ChallengeWindowView {
  code: string;
  title: string;
  attempts: string;
  clicks: string;
  locale: string;
  reviewerText: string;
  batchSize: string;
  activeText: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    attempts: string,
    clicks: string,
    locale: string,
    reviewerText: string,
    batchSize: string,
    activeText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.attempts = attempts;
    this.clicks = clicks;
    this.locale = locale;
    this.reviewerText = reviewerText;
    this.batchSize = batchSize;
    this.activeText = activeText;
    this.statusLabel = statusLabel;
  }
}

export function toChallengeWindowView(item: ChallengeWindow): ChallengeWindowView {
  return new ChallengeWindowView(
    text.truncate(item.code, 120),
    item.title,
    String(item.attempts),
    String(item.clicks),
    item.locale,
    text.truncate(item.reviewer, 120),
    String(item.batchSize),
    `${item.active}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toChallengeWindowViews(items: ChallengeWindow[]): ChallengeWindowView[] {
  const views: ChallengeWindowView[] = [];
  for (const item of items) {
    views.push(toChallengeWindowView(item));
  }
  return views;
}

export function sumChallengeWindowView(view: ChallengeWindowView): number {
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  const parsedClicks = Number(view.clicks);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicks} is not a number`);
  const parsedBatchSize = Number(view.batchSize);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSize} is not a number`);
  return parsedAttempts + parsedClicks + parsedBatchSize;
}
