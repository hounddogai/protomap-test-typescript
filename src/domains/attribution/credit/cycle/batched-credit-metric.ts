import * as text from "../../../../kit/text.js";

/** Where a batched credit metric is in its life cycle. */
export type BatchedCreditMetricStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One batched credit metric, with what the planners need to act on it. */
export class BatchedCreditMetric {
  code: string;
  title: string;
  minimum: number;
  score: number;
  startsAt: number;
  currency: string;
  clicks: number;
  status: BatchedCreditMetricStatus;

  constructor(
    code: string,
    title: string,
    minimum: number,
    score: number,
    startsAt: number,
    currency: string,
    clicks: number,
    status: BatchedCreditMetricStatus,
  ) {
    this.code = code;
    this.title = title;
    this.minimum = minimum;
    this.score = score;
    this.startsAt = startsAt;
    this.currency = currency;
    this.clicks = clicks;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: BatchedCreditMetricStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "in_review":
            return true;
        }
        return false;
      case "in_review":
        return next === "resolved" || next === "reopened";
      case "resolved":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: BatchedCreditMetricStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched credit metric ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  adjustedVolume(): number {
    return Math.round((this.minimum + this.clicks) * 100) / 100;
  }

  copy(): BatchedCreditMetric {
    return new BatchedCreditMetric(
      this.code,
      this.title,
      this.minimum,
      this.score,
      this.startsAt,
      this.currency,
      this.clicks,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a batched credit metric in status open. */
export function newBatchedCreditMetric(code: string, title: string): BatchedCreditMetric {
  return new BatchedCreditMetric(code, title, 0, 0, 0, "", 0, "open");
}
