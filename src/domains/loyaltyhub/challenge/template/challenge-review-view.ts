import { ChallengeReview } from "./challenge-review.js";

/** How screens and exports show a challenge review. */
export class ChallengeReviewView {
  code: string;
  name: string;
  regionText: string;
  impressions: string;
  capacity: string;
  versionText: string;
  cohort: string;
  priorityText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    regionText: string,
    impressions: string,
    capacity: string,
    versionText: string,
    cohort: string,
    priorityText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.regionText = regionText;
    this.impressions = impressions;
    this.capacity = capacity;
    this.versionText = versionText;
    this.cohort = cohort;
    this.priorityText = priorityText;
    this.statusLabel = statusLabel;
  }
}

export function toChallengeReviewView(item: ChallengeReview): ChallengeReviewView {
  return new ChallengeReviewView(
    item.code,
    item.name,
    item.region,
    String(item.impressions),
    String(item.capacity),
    String(item.version),
    item.cohort,
    String(item.priority),
    `${item.status}`.toUpperCase(),
  );
}

export function toChallengeReviewViews(items: ChallengeReview[]): ChallengeReviewView[] {
  const views: ChallengeReviewView[] = [];
  for (const item of items) {
    views.push(toChallengeReviewView(item));
  }
  return views;
}

export function sumChallengeReviewView(view: ChallengeReviewView): number {
  const parsedImpressions = Number(view.impressions);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressions} is not a number`);
  const parsedCapacity = Number(view.capacity);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacity} is not a number`);
  const parsedVersion = Number(view.versionText);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.versionText} is not a number`);
  return parsedImpressions + parsedCapacity + parsedVersion;
}
