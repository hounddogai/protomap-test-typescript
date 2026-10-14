/**
 * The reward review records of loyaltyhub's reward work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a reward review is in its life cycle. */
export type RewardReviewStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One reward review, with what the planners need to act on it. */
export class RewardReview {
  code: string;
  title: string;
  reviewer: string;
  createdAt: number;
  summary: string;
  status: RewardReviewStatus;

  constructor(
    code: string,
    title: string,
    reviewer: string,
    createdAt: number,
    summary: string,
    status: RewardReviewStatus,
  ) {
    this.code = code;
    this.title = title;
    this.reviewer = reviewer;
    this.createdAt = createdAt;
    this.summary = summary;
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

  canMoveTo(next: RewardReviewStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "scheduled":
          case "in_progress":
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

  moveTo(next: RewardReviewStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reward review ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"reward review"} ${this.code}`;
  }

  measuredValue(): number {
    return this.createdAt;
  }

  copy(): RewardReview {
    return new RewardReview(this.code, this.title, this.reviewer, this.createdAt, this.summary, this.status);
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a reward review in status planned. */
export function newRewardReview(code: string, title: string): RewardReview {
  return new RewardReview(code, title, "", 0, "", "planned");
}
