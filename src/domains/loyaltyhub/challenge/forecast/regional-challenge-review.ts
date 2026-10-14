import * as text from "../../../../kit/text.js";

/** Where a regional challenge review is in its life cycle. */
export type RegionalChallengeReviewStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A regional challenge review as the challenge team keeps it. */
export class RegionalChallengeReview {
  code: string;
  title: string;
  summary: string;
  notes: string;
  updatedAt: number;
  revision: number;
  ratio: number;
  status: RegionalChallengeReviewStatus;

  constructor(
    code: string,
    title: string,
    summary: string,
    notes: string,
    updatedAt: number,
    revision: number,
    ratio: number,
    status: RegionalChallengeReviewStatus,
  ) {
    this.code = code;
    this.title = title;
    this.summary = summary;
    this.notes = notes;
    this.updatedAt = updatedAt;
    this.revision = revision;
    this.ratio = ratio;
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

  canMoveTo(next: RegionalChallengeReviewStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "pending":
          case "closed":
            return true;
        }
        return false;
      case "pending":
        return next === "suspended" || next === "closed";
      case "active":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RegionalChallengeReviewStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional challenge review ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  projectedExposure(): number {
    return Math.round((this.ratio - this.revision) * 100) / 100;
  }

  copy(): RegionalChallengeReview {
    return new RegionalChallengeReview(
      this.code,
      this.title,
      this.summary,
      this.notes,
      this.updatedAt,
      this.revision,
      this.ratio,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a regional challenge review in status draft. */
export function newRegionalChallengeReview(code: string, title: string): RegionalChallengeReview {
  return new RegionalChallengeReview(code, title, "", "", 0, 0, 0, "draft");
}
