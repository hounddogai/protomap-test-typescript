import * as text from "../../../../kit/text.js";

/** Where a challenge review is in its life cycle. */
export type ChallengeReviewStatus = "created" | "validated" | "published" | "retired";

/** A challenge review as the challenge team keeps it. */
export class ChallengeReview {
  code: string;
  name: string;
  region: string;
  impressions: number;
  capacity: number;
  version: number;
  cohort: string;
  priority: number;
  status: ChallengeReviewStatus;

  constructor(
    code: string,
    name: string,
    region: string,
    impressions: number,
    capacity: number,
    version: number,
    cohort: string,
    priority: number,
    status: ChallengeReviewStatus,
  ) {
    this.code = code;
    this.name = name;
    this.region = region;
    this.impressions = impressions;
    this.capacity = capacity;
    this.version = version;
    this.cohort = cohort;
    this.priority = priority;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: ChallengeReviewStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated" || next === "retired";
      case "validated":
        return next === "retired";
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ChallengeReviewStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`challenge review ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  effectiveExposure(): number {
    return Math.round(this.capacity * this.version * 100) / 100;
  }

  copy(): ChallengeReview {
    return new ChallengeReview(
      this.code,
      this.name,
      this.region,
      this.impressions,
      this.capacity,
      this.version,
      this.cohort,
      this.priority,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a challenge review in status created. */
export function newChallengeReview(code: string, name: string): ChallengeReview {
  return new ChallengeReview(code, name, "", 0, 0, 0, "", 0, "created");
}
