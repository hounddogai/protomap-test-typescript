import * as text from "../../../../kit/text.js";

/** Where a global streak bundle is in its life cycle. */
export type GlobalStreakBundleStatus = "new" | "queued" | "running" | "done" | "failed";

/** One global streak bundle, with what the planners need to act on it. */
export class GlobalStreakBundle {
  code: string;
  label: string;
  floorValue: number;
  score: number;
  ownerId: string;
  graceDays: number;
  region: string;
  cohort: string;
  impressions: number;
  status: GlobalStreakBundleStatus;

  constructor(
    code: string,
    label: string,
    floorValue: number,
    score: number,
    ownerId: string,
    graceDays: number,
    region: string,
    cohort: string,
    impressions: number,
    status: GlobalStreakBundleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.floorValue = floorValue;
    this.score = score;
    this.ownerId = ownerId;
    this.graceDays = graceDays;
    this.region = region;
    this.cohort = cohort;
    this.impressions = impressions;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: GlobalStreakBundleStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
            return true;
        }
        return false;
      case "queued":
        return next === "done";
      case "running":
        return next === "done";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: GlobalStreakBundleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global streak bundle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  weightedVolume(): number {
    return Math.round((this.impressions - this.floorValue) * 100) / 100;
  }

  copy(): GlobalStreakBundle {
    return new GlobalStreakBundle(
      this.code,
      this.label,
      this.floorValue,
      this.score,
      this.ownerId,
      this.graceDays,
      this.region,
      this.cohort,
      this.impressions,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a global streak bundle in status new. */
export function newGlobalStreakBundle(code: string, label: string): GlobalStreakBundle {
  return new GlobalStreakBundle(code, label, 0, 0, "", 0, "", "", 0, "new");
}
