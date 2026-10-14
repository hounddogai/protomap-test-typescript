import * as text from "../../../../kit/text.js";

/** Where a batched level estimate is in its life cycle. */
export type BatchedLevelEstimateStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A batched level estimate as the level team keeps it. */
export class BatchedLevelEstimate {
  code: string;
  name: string;
  timezone: string;
  summary: string;
  region: string;
  rate: number;
  status: BatchedLevelEstimateStatus;

  constructor(
    code: string,
    name: string,
    timezone: string,
    summary: string,
    region: string,
    rate: number,
    status: BatchedLevelEstimateStatus,
  ) {
    this.code = code;
    this.name = name;
    this.timezone = timezone;
    this.summary = summary;
    this.region = region;
    this.rate = rate;
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

  canMoveTo(next: BatchedLevelEstimateStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "resolved" || next === "reopened";
      case "in_review":
        return next === "resolved" || next === "reopened";
      case "resolved":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: BatchedLevelEstimateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched level estimate ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"batched level estimate"} ${this.code}`;
  }

  measuredValue(): number {
    return this.rate;
  }

  copy(): BatchedLevelEstimate {
    return new BatchedLevelEstimate(
      this.code,
      this.name,
      this.timezone,
      this.summary,
      this.region,
      this.rate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a batched level estimate in status open. */
export function newBatchedLevelEstimate(code: string, name: string): BatchedLevelEstimate {
  return new BatchedLevelEstimate(code, name, "", "", "", 0, "open");
}
