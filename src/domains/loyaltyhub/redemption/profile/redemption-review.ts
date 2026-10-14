import * as text from "../../../../kit/text.js";

/** Where a redemption review is in its life cycle. */
export type RedemptionReviewStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a redemption review and its current status. */
export class RedemptionReview {
  code: string;
  title: string;
  externalRef: string;
  expiresAt: number;
  maximum: number;
  startsAt: number;
  status: RedemptionReviewStatus;

  constructor(
    code: string,
    title: string,
    externalRef: string,
    expiresAt: number,
    maximum: number,
    startsAt: number,
    status: RedemptionReviewStatus,
  ) {
    this.code = code;
    this.title = title;
    this.externalRef = externalRef;
    this.expiresAt = expiresAt;
    this.maximum = maximum;
    this.startsAt = startsAt;
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

  canMoveTo(next: RedemptionReviewStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "pending" || next === "closed";
      case "pending":
        switch (next) {
          case "active":
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

  moveTo(next: RedemptionReviewStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`redemption review ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"redemption review"} ${this.code}`;
  }

  weightedVolume(): number {
    return Math.round((this.startsAt + this.maximum) * 100) / 100;
  }

  copy(): RedemptionReview {
    return new RedemptionReview(
      this.code,
      this.title,
      this.externalRef,
      this.expiresAt,
      this.maximum,
      this.startsAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a redemption review in status draft. */
export function newRedemptionReview(code: string, title: string): RedemptionReview {
  return new RedemptionReview(code, title, "", 0, 0, 0, "draft");
}
