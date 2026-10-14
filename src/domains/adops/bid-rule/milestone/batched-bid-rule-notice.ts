import * as text from "../../../../kit/text.js";

/** Where a batched bid rule notice is in its life cycle. */
export type BatchedBidRuleNoticeStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One batched bid rule notice, with what the planners need to act on it. */
export class BatchedBidRuleNotice {
  code: string;
  title: string;
  clicks: number;
  ceiling: number;
  priority: number;
  minimum: number;
  timezone: string;
  journeyId: string;
  version: number;
  status: BatchedBidRuleNoticeStatus;

  constructor(
    code: string,
    title: string,
    clicks: number,
    ceiling: number,
    priority: number,
    minimum: number,
    timezone: string,
    journeyId: string,
    version: number,
    status: BatchedBidRuleNoticeStatus,
  ) {
    this.code = code;
    this.title = title;
    this.clicks = clicks;
    this.ceiling = ceiling;
    this.priority = priority;
    this.minimum = minimum;
    this.timezone = timezone;
    this.journeyId = journeyId;
    this.version = version;
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

  canMoveTo(next: BatchedBidRuleNoticeStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "active":
            return true;
        }
        return false;
      case "pending":
        return next === "active" || next === "closed";
      case "active":
        return next === "suspended" || next === "closed";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: BatchedBidRuleNoticeStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched bid rule notice ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  weightedTotal(): number {
    return Math.round(this.clicks * this.minimum * 100) / 100;
  }

  copy(): BatchedBidRuleNotice {
    return new BatchedBidRuleNotice(
      this.code,
      this.title,
      this.clicks,
      this.ceiling,
      this.priority,
      this.minimum,
      this.timezone,
      this.journeyId,
      this.version,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a batched bid rule notice in status draft. */
export function newBatchedBidRuleNotice(code: string, title: string): BatchedBidRuleNotice {
  return new BatchedBidRuleNotice(code, title, 0, 0, 0, 0, "", "", 0, "draft");
}
