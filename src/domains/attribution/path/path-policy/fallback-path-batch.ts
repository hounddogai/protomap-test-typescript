import * as text from "../../../../kit/text.js";

/** Where a fallback path batch is in its life cycle. */
export type FallbackPathBatchStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a fallback path batch and its current status. */
export class FallbackPathBatch {
  code: string;
  label: string;
  impressions: number;
  windowDays: number;
  externalRef: string;
  status: FallbackPathBatchStatus;

  constructor(
    code: string,
    label: string,
    impressions: number,
    windowDays: number,
    externalRef: string,
    status: FallbackPathBatchStatus,
  ) {
    this.code = code;
    this.label = label;
    this.impressions = impressions;
    this.windowDays = windowDays;
    this.externalRef = externalRef;
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

  canMoveTo(next: FallbackPathBatchStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "queued" || next === "running";
      case "queued":
        return next === "done" || next === "failed";
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

  moveTo(next: FallbackPathBatchStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback path batch ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"fallback path batch"} ${this.code}`;
  }

  effectiveTotal(): number {
    return Math.round((this.windowDays - this.impressions) * 100) / 100;
  }

  copy(): FallbackPathBatch {
    return new FallbackPathBatch(
      this.code,
      this.label,
      this.impressions,
      this.windowDays,
      this.externalRef,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a fallback path batch in status new. */
export function newFallbackPathBatch(code: string, label: string): FallbackPathBatch {
  return new FallbackPathBatch(code, label, 0, 0, "", "new");
}
