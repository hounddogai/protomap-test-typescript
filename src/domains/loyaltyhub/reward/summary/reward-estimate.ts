import * as text from "../../../../kit/text.js";

/** Where a reward estimate is in its life cycle. */
export type RewardEstimateStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a reward estimate and its current status. */
export class RewardEstimate {
  code: string;
  title: string;
  segment: string;
  channel: string;
  locale: string;
  score: number;
  status: RewardEstimateStatus;

  constructor(
    code: string,
    title: string,
    segment: string,
    channel: string,
    locale: string,
    score: number,
    status: RewardEstimateStatus,
  ) {
    this.code = code;
    this.title = title;
    this.segment = segment;
    this.channel = channel;
    this.locale = locale;
    this.score = score;
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

  canMoveTo(next: RewardEstimateStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "pending":
          case "closed":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "active":
          case "closed":
            return true;
        }
        return false;
      case "active":
        return next === "closed";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: RewardEstimateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reward estimate ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  measuredValue(): number {
    return this.score;
  }

  copy(): RewardEstimate {
    return new RewardEstimate(this.code, this.title, this.segment, this.channel, this.locale, this.score, this.status);
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a reward estimate in status draft. */
export function newRewardEstimate(code: string, title: string): RewardEstimate {
  return new RewardEstimate(code, title, "", "", "", 0, "draft");
}
