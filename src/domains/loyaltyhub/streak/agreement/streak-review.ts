import * as text from "../../../../kit/text.js";

/** Where a streak review is in its life cycle. */
export type StreakReviewStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A streak review as the streak team keeps it. */
export class StreakReview {
  code: string;
  name: string;
  margin: number;
  pinned: boolean;
  expiresAt: number;
  priority: number;
  budget: number;
  updatedAt: number;
  channel: string;
  campaignRef: string;
  status: StreakReviewStatus;

  constructor(
    code: string,
    name: string,
    margin: number,
    pinned: boolean,
    expiresAt: number,
    priority: number,
    budget: number,
    updatedAt: number,
    channel: string,
    campaignRef: string,
    status: StreakReviewStatus,
  ) {
    this.code = code;
    this.name = name;
    this.margin = margin;
    this.pinned = pinned;
    this.expiresAt = expiresAt;
    this.priority = priority;
    this.budget = budget;
    this.updatedAt = updatedAt;
    this.channel = channel;
    this.campaignRef = campaignRef;
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

  canMoveTo(next: StreakReviewStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "suspended" || next === "closed";
      case "pending":
        return next === "closed";
      case "active":
        return next === "closed";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: StreakReviewStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`streak review ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"streak review"} ${this.code}`;
  }

  effectiveTotal(): number {
    return Math.round(this.priority * this.updatedAt * 100) / 100;
  }

  copy(): StreakReview {
    return new StreakReview(
      this.code,
      this.name,
      this.margin,
      this.pinned,
      this.expiresAt,
      this.priority,
      this.budget,
      this.updatedAt,
      this.channel,
      this.campaignRef,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a streak review in status draft. */
export function newStreakReview(code: string, name: string): StreakReview {
  return new StreakReview(code, name, 0, false, 0, 0, 0, 0, "", "", "draft");
}
