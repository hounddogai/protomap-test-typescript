import * as text from "../../../../kit/text.js";

/** Where a batched creative review is in its life cycle. */
export type BatchedCreativeReviewStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a batched creative review and its current status. */
export class BatchedCreativeReview {
  code: string;
  title: string;
  startsAt: number;
  updatedAt: number;
  variant: string;
  status: BatchedCreativeReviewStatus;

  constructor(
    code: string,
    title: string,
    startsAt: number,
    updatedAt: number,
    variant: string,
    status: BatchedCreativeReviewStatus,
  ) {
    this.code = code;
    this.title = title;
    this.startsAt = startsAt;
    this.updatedAt = updatedAt;
    this.variant = variant;
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

  canMoveTo(next: BatchedCreativeReviewStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "scheduled":
          case "cancelled":
            return true;
        }
        return false;
      case "scheduled":
        return next === "cancelled";
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: BatchedCreativeReviewStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched creative review ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  adjustedLoad(): number {
    return Math.round(this.startsAt * this.updatedAt * 100) / 100;
  }

  copy(): BatchedCreativeReview {
    return new BatchedCreativeReview(this.code, this.title, this.startsAt, this.updatedAt, this.variant, this.status);
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a batched creative review in status planned. */
export function newBatchedCreativeReview(code: string, title: string): BatchedCreativeReview {
  return new BatchedCreativeReview(code, title, 0, 0, "", "planned");
}
