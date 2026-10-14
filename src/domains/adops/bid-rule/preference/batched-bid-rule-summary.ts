import * as text from "../../../../kit/text.js";

/** Where a batched bid rule summary is in its life cycle. */
export type BatchedBidRuleSummaryStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a batched bid rule summary and its current status. */
export class BatchedBidRuleSummary {
  code: string;
  name: string;
  active: boolean;
  unit: string;
  revision: number;
  impressions: number;
  frequencyCap: number;
  status: BatchedBidRuleSummaryStatus;

  constructor(
    code: string,
    name: string,
    active: boolean,
    unit: string,
    revision: number,
    impressions: number,
    frequencyCap: number,
    status: BatchedBidRuleSummaryStatus,
  ) {
    this.code = code;
    this.name = name;
    this.active = active;
    this.unit = unit;
    this.revision = revision;
    this.impressions = impressions;
    this.frequencyCap = frequencyCap;
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

  canMoveTo(next: BatchedBidRuleSummaryStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "resolved":
          case "reopened":
            return true;
        }
        return false;
      case "in_review":
        return next === "resolved" || next === "archived";
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

  moveTo(next: BatchedBidRuleSummaryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched bid rule summary ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  weightedExposure(): number {
    return Math.round((this.revision - this.frequencyCap) * 100) / 100;
  }

  copy(): BatchedBidRuleSummary {
    return new BatchedBidRuleSummary(
      this.code,
      this.name,
      this.active,
      this.unit,
      this.revision,
      this.impressions,
      this.frequencyCap,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a batched bid rule summary in status open. */
export function newBatchedBidRuleSummary(code: string, name: string): BatchedBidRuleSummary {
  return new BatchedBidRuleSummary(code, name, false, "", 0, 0, 0, "open");
}
