import * as text from "../../../../kit/text.js";

/** Where a batched challenge review is in its life cycle. */
export type BatchedChallengeReviewStatus = "created" | "validated" | "published" | "retired";

/** The record of a batched challenge review and its current status. */
export class BatchedChallengeReview {
  code: string;
  name: string;
  sendAt: number;
  notes: string;
  endsAt: number;
  title: string;
  limit: number;
  status: BatchedChallengeReviewStatus;

  constructor(
    code: string,
    name: string,
    sendAt: number,
    notes: string,
    endsAt: number,
    title: string,
    limit: number,
    status: BatchedChallengeReviewStatus,
  ) {
    this.code = code;
    this.name = name;
    this.sendAt = sendAt;
    this.notes = notes;
    this.endsAt = endsAt;
    this.title = title;
    this.limit = limit;
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

  canMoveTo(next: BatchedChallengeReviewStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "published" || next === "retired";
      case "validated":
        switch (next) {
          case "published":
            return true;
        }
        return false;
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: BatchedChallengeReviewStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched challenge review ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"batched challenge review"} ${this.code}`;
  }

  weightedValue(): number {
    return Math.round(this.sendAt * this.endsAt * 100) / 100;
  }

  copy(): BatchedChallengeReview {
    return new BatchedChallengeReview(
      this.code,
      this.name,
      this.sendAt,
      this.notes,
      this.endsAt,
      this.title,
      this.limit,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a batched challenge review in status created. */
export function newBatchedChallengeReview(code: string, name: string): BatchedChallengeReview {
  return new BatchedChallengeReview(code, name, 0, "", 0, "", 0, "created");
}
