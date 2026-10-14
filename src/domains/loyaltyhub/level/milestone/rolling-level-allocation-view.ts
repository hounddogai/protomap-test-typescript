import { RollingLevelAllocation } from "./rolling-level-allocation.js";

/** How screens and exports show a rolling level allocation. */
export class RollingLevelAllocationView {
  code: string;
  title: string;
  attempts: string;
  categoryText: string;
  pinned: string;
  timezone: string;
  endsAtText: string;
  cohort: string;
  score: string;
  audienceId: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    attempts: string,
    categoryText: string,
    pinned: string,
    timezone: string,
    endsAtText: string,
    cohort: string,
    score: string,
    audienceId: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.attempts = attempts;
    this.categoryText = categoryText;
    this.pinned = pinned;
    this.timezone = timezone;
    this.endsAtText = endsAtText;
    this.cohort = cohort;
    this.score = score;
    this.audienceId = audienceId;
    this.statusLabel = statusLabel;
  }
}

export function toRollingLevelAllocationView(item: RollingLevelAllocation): RollingLevelAllocationView {
  return new RollingLevelAllocationView(
    item.code,
    item.title,
    String(item.attempts),
    item.category,
    `${item.pinned}`,
    item.timezone,
    String(item.endsAt),
    item.cohort,
    item.score.toFixed(2),
    item.audienceId,
    `${item.status}`.toUpperCase(),
  );
}

export function toRollingLevelAllocationViews(items: RollingLevelAllocation[]): RollingLevelAllocationView[] {
  const views: RollingLevelAllocationView[] = [];
  for (const item of items) {
    views.push(toRollingLevelAllocationView(item));
  }
  return views;
}

export function sumRollingLevelAllocationView(view: RollingLevelAllocationView): number {
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  const parsedEndsAt = Number(view.endsAtText);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAtText} is not a number`);
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  return parsedAttempts + parsedEndsAt + parsedScore;
}
