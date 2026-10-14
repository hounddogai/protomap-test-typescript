import * as text from "../../../../kit/text.js";

/** Where a bounce review is in its life cycle. */
export type BounceReviewStatus = "new" | "queued" | "running" | "done" | "failed";

/** A bounce review. Its code is unique within a tenant. */
export class BounceReview {
  code: string;
  name: string;
  ownerId: string;
  maximum: number;
  windowDays: number;
  status: BounceReviewStatus;

  constructor(
    code: string,
    name: string,
    ownerId: string,
    maximum: number,
    windowDays: number,
    status: BounceReviewStatus,
  ) {
    this.code = code;
    this.name = name;
    this.ownerId = ownerId;
    this.maximum = maximum;
    this.windowDays = windowDays;
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

  canMoveTo(next: BounceReviewStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "queued" || next === "running";
      case "queued":
        return next === "done";
      case "running":
        return next === "done" || next === "failed";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: BounceReviewStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`bounce review ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  weightedLoad(): number {
    return Math.round((this.windowDays + this.maximum) * 100) / 100;
  }

  copy(): BounceReview {
    return new BounceReview(this.code, this.name, this.ownerId, this.maximum, this.windowDays, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a bounce review in status new. */
export function newBounceReview(code: string, name: string): BounceReview {
  return new BounceReview(code, name, "", 0, 0, "new");
}
