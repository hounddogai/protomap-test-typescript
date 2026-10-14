import * as text from "../../../../kit/text.js";

/** Where a batched leaderboard agreement is in its life cycle. */
export type BatchedLeaderboardAgreementStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a batched leaderboard agreement and its current status. */
export class BatchedLeaderboardAgreement {
  code: string;
  title: string;
  discount: number;
  retries: number;
  variant: string;
  channel: string;
  revision: number;
  minimum: number;
  status: BatchedLeaderboardAgreementStatus;

  constructor(
    code: string,
    title: string,
    discount: number,
    retries: number,
    variant: string,
    channel: string,
    revision: number,
    minimum: number,
    status: BatchedLeaderboardAgreementStatus,
  ) {
    this.code = code;
    this.title = title;
    this.discount = discount;
    this.retries = retries;
    this.variant = variant;
    this.channel = channel;
    this.revision = revision;
    this.minimum = minimum;
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

  canMoveTo(next: BatchedLeaderboardAgreementStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "scheduled" || next === "cancelled";
      case "scheduled":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "in_progress":
        return next === "cancelled";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: BatchedLeaderboardAgreementStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched leaderboard agreement ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  projectedValue(): number {
    return Math.round((this.discount - this.retries) * 100) / 100;
  }

  copy(): BatchedLeaderboardAgreement {
    return new BatchedLeaderboardAgreement(
      this.code,
      this.title,
      this.discount,
      this.retries,
      this.variant,
      this.channel,
      this.revision,
      this.minimum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a batched leaderboard agreement in status planned. */
export function newBatchedLeaderboardAgreement(code: string, title: string): BatchedLeaderboardAgreement {
  return new BatchedLeaderboardAgreement(code, title, 0, 0, "", "", 0, 0, "planned");
}
