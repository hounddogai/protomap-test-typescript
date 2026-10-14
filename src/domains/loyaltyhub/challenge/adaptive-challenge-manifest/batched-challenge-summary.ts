import * as text from "../../../../kit/text.js";

/** Where a batched challenge summary is in its life cycle. */
export type BatchedChallengeSummaryStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One batched challenge summary, with what the planners need to act on it. */
export class BatchedChallengeSummary {
  code: string;
  title: string;
  currency: string;
  cohort: string;
  clicks: number;
  segment: string;
  status: BatchedChallengeSummaryStatus;

  constructor(
    code: string,
    title: string,
    currency: string,
    cohort: string,
    clicks: number,
    segment: string,
    status: BatchedChallengeSummaryStatus,
  ) {
    this.code = code;
    this.title = title;
    this.currency = currency;
    this.cohort = cohort;
    this.clicks = clicks;
    this.segment = segment;
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

  canMoveTo(next: BatchedChallengeSummaryStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "scheduled" || next === "in_progress";
      case "scheduled":
        switch (next) {
          case "in_progress":
            return true;
        }
        return false;
      case "in_progress":
        return next === "completed";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: BatchedChallengeSummaryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched challenge summary ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"batched challenge summary"} ${this.code}`;
  }

  measuredValue(): number {
    return this.clicks;
  }

  copy(): BatchedChallengeSummary {
    return new BatchedChallengeSummary(
      this.code,
      this.title,
      this.currency,
      this.cohort,
      this.clicks,
      this.segment,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a batched challenge summary in status planned. */
export function newBatchedChallengeSummary(code: string, title: string): BatchedChallengeSummary {
  return new BatchedChallengeSummary(code, title, "", "", 0, "", "planned");
}
