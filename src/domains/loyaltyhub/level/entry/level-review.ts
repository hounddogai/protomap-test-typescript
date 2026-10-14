import * as text from "../../../../kit/text.js";

/** Where a level review is in its life cycle. */
export type LevelReviewStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a level review and its current status. */
export class LevelReview {
  code: string;
  label: string;
  ownerId: string;
  conversionRate: number;
  score: number;
  cohort: string;
  status: LevelReviewStatus;

  constructor(
    code: string,
    label: string,
    ownerId: string,
    conversionRate: number,
    score: number,
    cohort: string,
    status: LevelReviewStatus,
  ) {
    this.code = code;
    this.label = label;
    this.ownerId = ownerId;
    this.conversionRate = conversionRate;
    this.score = score;
    this.cohort = cohort;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: LevelReviewStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "scheduled" || next === "completed";
      case "scheduled":
        return next === "in_progress" || next === "cancelled";
      case "in_progress":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: LevelReviewStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`level review ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  effectiveVolume(): number {
    return Math.round((this.conversionRate - this.score) * 100) / 100;
  }

  copy(): LevelReview {
    return new LevelReview(
      this.code,
      this.label,
      this.ownerId,
      this.conversionRate,
      this.score,
      this.cohort,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a level review in status planned. */
export function newLevelReview(code: string, label: string): LevelReview {
  return new LevelReview(code, label, "", 0, 0, "", "planned");
}
