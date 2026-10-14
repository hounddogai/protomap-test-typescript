import * as text from "../../../../kit/text.js";

/** Where a batched post exception is in its life cycle. */
export type BatchedPostExceptionStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A batched post exception as the post team keeps it. */
export class BatchedPostException {
  code: string;
  title: string;
  pinned: boolean;
  unit: string;
  frequencyCap: number;
  threshold: number;
  region: string;
  margin: number;
  summary: string;
  label: string;
  cost: number;
  status: BatchedPostExceptionStatus;

  constructor(
    code: string,
    title: string,
    pinned: boolean,
    unit: string,
    frequencyCap: number,
    threshold: number,
    region: string,
    margin: number,
    summary: string,
    label: string,
    cost: number,
    status: BatchedPostExceptionStatus,
  ) {
    this.code = code;
    this.title = title;
    this.pinned = pinned;
    this.unit = unit;
    this.frequencyCap = frequencyCap;
    this.threshold = threshold;
    this.region = region;
    this.margin = margin;
    this.summary = summary;
    this.label = label;
    this.cost = cost;
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

  canMoveTo(next: BatchedPostExceptionStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "in_review":
          case "reopened":
            return true;
        }
        return false;
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
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: BatchedPostExceptionStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched post exception ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.title})`;
  }

  weightedLoad(): number {
    return Math.round(this.cost * this.threshold * 100) / 100;
  }

  copy(): BatchedPostException {
    return new BatchedPostException(
      this.code,
      this.title,
      this.pinned,
      this.unit,
      this.frequencyCap,
      this.threshold,
      this.region,
      this.margin,
      this.summary,
      this.label,
      this.cost,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a batched post exception in status open. */
export function newBatchedPostException(code: string, title: string): BatchedPostException {
  return new BatchedPostException(code, title, false, "", 0, 0, "", 0, "", "", 0, "open");
}
