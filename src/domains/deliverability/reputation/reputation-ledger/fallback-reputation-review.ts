import * as text from "../../../../kit/text.js";

/** Where a fallback reputation review is in its life cycle. */
export type FallbackReputationReviewStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A fallback reputation review as the reputation team keeps it. */
export class FallbackReputationReview {
  code: string;
  name: string;
  bid: number;
  score: number;
  journeyId: string;
  durationMinutes: number;
  status: FallbackReputationReviewStatus;

  constructor(
    code: string,
    name: string,
    bid: number,
    score: number,
    journeyId: string,
    durationMinutes: number,
    status: FallbackReputationReviewStatus,
  ) {
    this.code = code;
    this.name = name;
    this.bid = bid;
    this.score = score;
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

  canMoveTo(next: FallbackReputationReviewStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "pending":
            return true;
        }
        return false;
      case "pending":
        return next === "active" || next === "suspended";
      case "active":
        return next === "suspended";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: FallbackReputationReviewStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback reputation review ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  netLoad(): number {
    return Math.round(this.score * this.durationMinutes * 100) / 100;
  }

  copy(): FallbackReputationReview {
    return new FallbackReputationReview(
      this.code,
      this.name,
      this.bid,
      this.score,
      this.journeyId,
      this.durationMinutes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a fallback reputation review in status draft. */
export function newFallbackReputationReview(code: string, name: string): FallbackReputationReview {
  return new FallbackReputationReview(code, name, 0, 0, "", 0, "draft");
}
