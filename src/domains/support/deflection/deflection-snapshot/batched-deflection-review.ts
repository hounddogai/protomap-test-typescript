import * as text from "../../../../kit/text.js";

/** Where a batched deflection review is in its life cycle. */
export type BatchedDeflectionReviewStatus = "new" | "queued" | "running" | "done" | "failed";

/** One batched deflection review, with what the planners need to act on it. */
export class BatchedDeflectionReview {
  code: string;
  label: string;
  unit: string;
  durationMinutes: number;
  channel: string;
  weight: number;
  journeyId: string;
  frequencyCap: number;
  status: BatchedDeflectionReviewStatus;

  constructor(
    code: string,
    label: string,
    unit: string,
    durationMinutes: number,
    channel: string,
    weight: number,
    journeyId: string,
    frequencyCap: number,
    status: BatchedDeflectionReviewStatus,
  ) {
    this.code = code;
    this.label = label;
    this.unit = unit;
    this.durationMinutes = durationMinutes;
    this.channel = channel;
    this.weight = weight;
    this.journeyId = journeyId;
    this.frequencyCap = frequencyCap;
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

  canMoveTo(next: BatchedDeflectionReviewStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "failed";
      case "queued":
        return next === "done";
      case "running":
        return next === "done";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: BatchedDeflectionReviewStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched deflection review ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  projectedExposure(): number {
    return Math.round((this.weight + this.durationMinutes) * 100) / 100;
  }

  copy(): BatchedDeflectionReview {
    return new BatchedDeflectionReview(
      this.code,
      this.label,
      this.unit,
      this.durationMinutes,
      this.channel,
      this.weight,
      this.journeyId,
      this.frequencyCap,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a batched deflection review in status new. */
export function newBatchedDeflectionReview(code: string, label: string): BatchedDeflectionReview {
  return new BatchedDeflectionReview(code, label, "", 0, "", 0, "", 0, "new");
}
