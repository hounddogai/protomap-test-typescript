import * as text from "../../../../kit/text.js";

/** Where a batched nudge summary is in its life cycle. */
export type BatchedNudgeSummaryStatus = "new" | "queued" | "running" | "done" | "failed";

/** One batched nudge summary, with what the planners need to act on it. */
export class BatchedNudgeSummary {
  code: string;
  label: string;
  audienceId: string;
  impressions: number;
  batchSize: number;
  discount: number;
  country: string;
  margin: number;
  source: string;
  status: BatchedNudgeSummaryStatus;

  constructor(
    code: string,
    label: string,
    audienceId: string,
    impressions: number,
    batchSize: number,
    discount: number,
    country: string,
    margin: number,
    source: string,
    status: BatchedNudgeSummaryStatus,
  ) {
    this.code = code;
    this.label = label;
    this.audienceId = audienceId;
    this.impressions = impressions;
    this.batchSize = batchSize;
    this.discount = discount;
    this.country = country;
    this.margin = margin;
    this.source = source;
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

  canMoveTo(next: BatchedNudgeSummaryStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "queued";
      case "queued":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "running":
        return next === "failed";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: BatchedNudgeSummaryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched nudge summary ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  effectiveTotal(): number {
    return Math.round((this.discount + this.impressions) * 100) / 100;
  }

  copy(): BatchedNudgeSummary {
    return new BatchedNudgeSummary(
      this.code,
      this.label,
      this.audienceId,
      this.impressions,
      this.batchSize,
      this.discount,
      this.country,
      this.margin,
      this.source,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a batched nudge summary in status new. */
export function newBatchedNudgeSummary(code: string, label: string): BatchedNudgeSummary {
  return new BatchedNudgeSummary(code, label, "", 0, 0, 0, "", 0, "", "new");
}
