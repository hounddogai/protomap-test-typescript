import * as text from "../../../../kit/text.js";

/** Where a batched approval review is in its life cycle. */
export type BatchedApprovalReviewStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a batched approval review and its current status. */
export class BatchedApprovalReview {
  code: string;
  title: string;
  budget: number;
  durationMinutes: number;
  discount: number;
  updatedAt: number;
  endsAt: number;
  status: BatchedApprovalReviewStatus;

  constructor(
    code: string,
    title: string,
    budget: number,
    durationMinutes: number,
    discount: number,
    updatedAt: number,
    endsAt: number,
    status: BatchedApprovalReviewStatus,
  ) {
    this.code = code;
    this.title = title;
    this.budget = budget;
    this.durationMinutes = durationMinutes;
    this.discount = discount;
    this.updatedAt = updatedAt;
    this.endsAt = endsAt;
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

  canMoveTo(next: BatchedApprovalReviewStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "active";
      case "pending":
        switch (next) {
          case "active":
          case "suspended":
            return true;
        }
        return false;
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

  moveTo(next: BatchedApprovalReviewStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched approval review ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  effectiveVolume(): number {
    return Math.round((this.budget - this.endsAt) * 100) / 100;
  }

  copy(): BatchedApprovalReview {
    return new BatchedApprovalReview(
      this.code,
      this.title,
      this.budget,
      this.durationMinutes,
      this.discount,
      this.updatedAt,
      this.endsAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a batched approval review in status draft. */
export function newBatchedApprovalReview(code: string, title: string): BatchedApprovalReview {
  return new BatchedApprovalReview(code, title, 0, 0, 0, 0, 0, "draft");
}
