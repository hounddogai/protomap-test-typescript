import * as text from "../../../../kit/text.js";

/** Where a nudge review is in its life cycle. */
export type NudgeReviewStatus = "new" | "queued" | "running" | "done" | "failed";

/** A nudge review. Its code is unique within a tenant. */
export class NudgeReview {
  code: string;
  title: string;
  batchSize: number;
  channel: string;
  budget: number;
  ceiling: number;
  priority: number;
  graceDays: number;
  limit: number;
  status: NudgeReviewStatus;

  constructor(
    code: string,
    title: string,
    batchSize: number,
    channel: string,
    budget: number,
    ceiling: number,
    priority: number,
    graceDays: number,
    limit: number,
    status: NudgeReviewStatus,
  ) {
    this.code = code;
    this.title = title;
    this.batchSize = batchSize;
    this.channel = channel;
    this.budget = budget;
    this.ceiling = ceiling;
    this.priority = priority;
    this.graceDays = graceDays;
    this.limit = limit;
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

  canMoveTo(next: NudgeReviewStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "queued";
      case "queued":
        return next === "running" || next === "done";
      case "running":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: NudgeReviewStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`nudge review ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"nudge review"} ${this.code}`;
  }

  weightedTotal(): number {
    return Math.round(this.limit * this.batchSize * 100) / 100;
  }

  copy(): NudgeReview {
    return new NudgeReview(
      this.code,
      this.title,
      this.batchSize,
      this.channel,
      this.budget,
      this.ceiling,
      this.priority,
      this.graceDays,
      this.limit,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a nudge review in status new. */
export function newNudgeReview(code: string, title: string): NudgeReview {
  return new NudgeReview(code, title, 0, "", 0, 0, 0, 0, 0, "new");
}
