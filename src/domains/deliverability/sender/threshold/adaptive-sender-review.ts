import * as text from "../../../../kit/text.js";

/** Where a adaptive sender review is in its life cycle. */
export type AdaptiveSenderReviewStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One adaptive sender review, with what the planners need to act on it. */
export class AdaptiveSenderReview {
  code: string;
  label: string;
  clicks: number;
  bid: number;
  startsAt: number;
  sendAt: number;
  status: AdaptiveSenderReviewStatus;

  constructor(
    code: string,
    label: string,
    clicks: number,
    bid: number,
    startsAt: number,
    sendAt: number,
    status: AdaptiveSenderReviewStatus,
  ) {
    this.code = code;
    this.label = label;
    this.clicks = clicks;
    this.bid = bid;
    this.startsAt = startsAt;
    this.sendAt = sendAt;
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

  canMoveTo(next: AdaptiveSenderReviewStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "completed";
      case "scheduled":
        switch (next) {
          case "in_progress":
            return true;
        }
        return false;
      case "in_progress":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: AdaptiveSenderReviewStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive sender review ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  effectiveValue(): number {
    return Math.round(this.bid * this.clicks * 100) / 100;
  }

  copy(): AdaptiveSenderReview {
    return new AdaptiveSenderReview(
      this.code,
      this.label,
      this.clicks,
      this.bid,
      this.startsAt,
      this.sendAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a adaptive sender review in status planned. */
export function newAdaptiveSenderReview(code: string, label: string): AdaptiveSenderReview {
  return new AdaptiveSenderReview(code, label, 0, 0, 0, 0, "planned");
}
