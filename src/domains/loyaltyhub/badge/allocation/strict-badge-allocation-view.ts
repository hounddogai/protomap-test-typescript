import { StrictBadgeAllocation } from "./strict-badge-allocation.js";

/** How screens and exports show a strict badge allocation. */
export class StrictBadgeAllocationView {
  code: string;
  titleText: string;
  frequencyCap: string;
  scoreText: string;
  attempts: string;
  graceDays: string;
  version: string;
  capacity: string;
  revisionText: string;
  active: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    frequencyCap: string,
    scoreText: string,
    attempts: string,
    graceDays: string,
    version: string,
    capacity: string,
    revisionText: string,
    active: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.frequencyCap = frequencyCap;
    this.scoreText = scoreText;
    this.attempts = attempts;
    this.graceDays = graceDays;
    this.version = version;
    this.capacity = capacity;
    this.revisionText = revisionText;
    this.active = active;
    this.statusLabel = statusLabel;
  }
}

export function toStrictBadgeAllocationView(item: StrictBadgeAllocation): StrictBadgeAllocationView {
  return new StrictBadgeAllocationView(
    item.code,
    item.title,
    String(item.frequencyCap),
    item.score.toFixed(2),
    String(item.attempts),
    String(item.graceDays),
    String(item.version),
    String(item.capacity),
    String(item.revision),
    `${item.active}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toStrictBadgeAllocationViews(items: StrictBadgeAllocation[]): StrictBadgeAllocationView[] {
  const views: StrictBadgeAllocationView[] = [];
  for (const item of items) {
    views.push(toStrictBadgeAllocationView(item));
  }
  return views;
}

export function sumStrictBadgeAllocationView(view: StrictBadgeAllocationView): number {
  const parsedFrequencyCap = Number(view.frequencyCap);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCap} is not a number`);
  const parsedScore = Number(view.scoreText);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.scoreText} is not a number`);
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  return parsedFrequencyCap + parsedScore + parsedAttempts;
}
