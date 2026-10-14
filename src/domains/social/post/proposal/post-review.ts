import * as text from "../../../../kit/text.js";

/** Where a post review is in its life cycle. */
export type PostReviewStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One post review, with what the planners need to act on it. */
export class PostReview {
  code: string;
  label: string;
  description: string;
  ownerId: string;
  reviewer: string;
  region: string;
  retries: number;
  cost: number;
  graceDays: number;
  discount: number;
  status: PostReviewStatus;

  constructor(
    code: string,
    label: string,
    description: string,
    ownerId: string,
    reviewer: string,
    region: string,
    retries: number,
    cost: number,
    graceDays: number,
    discount: number,
    status: PostReviewStatus,
  ) {
    this.code = code;
    this.label = label;
    this.description = description;
    this.ownerId = ownerId;
    this.reviewer = reviewer;
    this.region = region;
    this.retries = retries;
    this.cost = cost;
    this.graceDays = graceDays;
    this.discount = discount;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: PostReviewStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "resolved":
            return true;
        }
        return false;
      case "resolved":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: PostReviewStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`post review ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  effectiveVolume(): number {
    return Math.round((this.cost + this.graceDays) * 100) / 100;
  }

  copy(): PostReview {
    return new PostReview(
      this.code,
      this.label,
      this.description,
      this.ownerId,
      this.reviewer,
      this.region,
      this.retries,
      this.cost,
      this.graceDays,
      this.discount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a post review in status open. */
export function newPostReview(code: string, label: string): PostReview {
  return new PostReview(code, label, "", "", "", "", 0, 0, 0, 0, "open");
}
