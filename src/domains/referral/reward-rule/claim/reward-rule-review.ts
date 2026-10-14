import * as text from "../../../../kit/text.js";

/** Where a reward rule review is in its life cycle. */
export type RewardRuleReviewStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One reward rule review, with what the planners need to act on it. */
export class RewardRuleReview {
  code: string;
  title: string;
  channel: string;
  unit: string;
  reviewer: string;
  retries: number;
  source: string;
  status: RewardRuleReviewStatus;

  constructor(
    code: string,
    title: string,
    channel: string,
    unit: string,
    reviewer: string,
    retries: number,
    source: string,
    status: RewardRuleReviewStatus,
  ) {
    this.code = code;
    this.title = title;
    this.channel = channel;
    this.unit = unit;
    this.reviewer = reviewer;
    this.retries = retries;
    this.source = source;
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

  canMoveTo(next: RewardRuleReviewStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "scheduled":
        return next === "in_progress" || next === "completed";
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RewardRuleReviewStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reward rule review ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  measuredValue(): number {
    return this.retries;
  }

  copy(): RewardRuleReview {
    return new RewardRuleReview(
      this.code,
      this.title,
      this.channel,
      this.unit,
      this.reviewer,
      this.retries,
      this.source,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a reward rule review in status planned. */
export function newRewardRuleReview(code: string, title: string): RewardRuleReview {
  return new RewardRuleReview(code, title, "", "", "", 0, "", "planned");
}
