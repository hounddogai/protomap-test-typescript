import * as text from "../../../../kit/text.js";

/** Where a badge review is in its life cycle. */
export type BadgeReviewStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a badge review and its current status. */
export class BadgeReview {
  code: string;
  name: string;
  frequencyCap: number;
  threshold: number;
  sequence: number;
  journeyId: string;
  durationMinutes: number;
  status: BadgeReviewStatus;

  constructor(
    code: string,
    name: string,
    frequencyCap: number,
    threshold: number,
    sequence: number,
    journeyId: string,
    durationMinutes: number,
    status: BadgeReviewStatus,
  ) {
    this.code = code;
    this.name = name;
    this.frequencyCap = frequencyCap;
    this.threshold = threshold;
    this.sequence = sequence;
    this.journeyId = journeyId;
    this.durationMinutes = durationMinutes;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: BadgeReviewStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "pending";
      case "pending":
        switch (next) {
          case "active":
          case "suspended":
            return true;
        }
        return false;
      case "active":
        return next === "suspended";
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: BadgeReviewStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`badge review ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  adjustedVolume(): number {
    return Math.round((this.durationMinutes + this.frequencyCap) * 100) / 100;
  }

  copy(): BadgeReview {
    return new BadgeReview(
      this.code,
      this.name,
      this.frequencyCap,
      this.threshold,
      this.sequence,
      this.journeyId,
      this.durationMinutes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a badge review in status draft. */
export function newBadgeReview(code: string, name: string): BadgeReview {
  return new BadgeReview(code, name, 0, 0, 0, "", 0, "draft");
}
