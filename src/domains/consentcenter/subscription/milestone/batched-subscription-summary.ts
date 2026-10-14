import * as text from "../../../../kit/text.js";

/** Where a batched subscription summary is in its life cycle. */
export type BatchedSubscriptionSummaryStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One batched subscription summary, with what the planners need to act on it. */
export class BatchedSubscriptionSummary {
  code: string;
  label: string;
  batchSize: number;
  audienceId: string;
  active: boolean;
  status: BatchedSubscriptionSummaryStatus;

  constructor(
    code: string,
    label: string,
    batchSize: number,
    audienceId: string,
    active: boolean,
    status: BatchedSubscriptionSummaryStatus,
  ) {
    this.code = code;
    this.label = label;
    this.batchSize = batchSize;
    this.audienceId = audienceId;
    this.active = active;
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

  canMoveTo(next: BatchedSubscriptionSummaryStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "closed";
      case "pending":
        switch (next) {
          case "active":
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

  moveTo(next: BatchedSubscriptionSummaryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched subscription summary ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  measuredValue(): number {
    return this.batchSize;
  }

  copy(): BatchedSubscriptionSummary {
    return new BatchedSubscriptionSummary(
      this.code,
      this.label,
      this.batchSize,
      this.audienceId,
      this.active,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a batched subscription summary in status draft. */
export function newBatchedSubscriptionSummary(code: string, label: string): BatchedSubscriptionSummary {
  return new BatchedSubscriptionSummary(code, label, 0, "", false, "draft");
}
