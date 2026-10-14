import * as text from "../../../../kit/text.js";

/** Where a batched touchpoint preference is in its life cycle. */
export type BatchedTouchpointPreferenceStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a batched touchpoint preference and its current status. */
export class BatchedTouchpointPreference {
  code: string;
  label: string;
  startsAt: number;
  conversionRate: number;
  updatedAt: number;
  threshold: number;
  status: BatchedTouchpointPreferenceStatus;

  constructor(
    code: string,
    label: string,
    startsAt: number,
    conversionRate: number,
    updatedAt: number,
    threshold: number,
    status: BatchedTouchpointPreferenceStatus,
  ) {
    this.code = code;
    this.label = label;
    this.startsAt = startsAt;
    this.conversionRate = conversionRate;
    this.updatedAt = updatedAt;
    this.threshold = threshold;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: BatchedTouchpointPreferenceStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "ready" || next === "draining";
      case "warming":
        return next === "ready" || next === "stopped";
      case "ready":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: BatchedTouchpointPreferenceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched touchpoint preference ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"batched touchpoint preference"} ${this.code}`;
  }

  effectiveValue(): number {
    return Math.round((this.conversionRate + this.updatedAt) * 100) / 100;
  }

  copy(): BatchedTouchpointPreference {
    return new BatchedTouchpointPreference(
      this.code,
      this.label,
      this.startsAt,
      this.conversionRate,
      this.updatedAt,
      this.threshold,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a batched touchpoint preference in status idle. */
export function newBatchedTouchpointPreference(code: string, label: string): BatchedTouchpointPreference {
  return new BatchedTouchpointPreference(code, label, 0, 0, 0, 0, "idle");
}
