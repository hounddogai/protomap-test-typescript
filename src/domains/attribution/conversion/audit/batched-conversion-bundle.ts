import * as text from "../../../../kit/text.js";

/** Where a batched conversion bundle is in its life cycle. */
export type BatchedConversionBundleStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One batched conversion bundle, with what the planners need to act on it. */
export class BatchedConversionBundle {
  code: string;
  label: string;
  threshold: number;
  active: boolean;
  frequencyCap: number;
  ceiling: number;
  currency: string;
  notes: string;
  campaignRef: string;
  createdAt: number;
  minimum: number;
  status: BatchedConversionBundleStatus;

  constructor(
    code: string,
    label: string,
    threshold: number,
    active: boolean,
    frequencyCap: number,
    ceiling: number,
    currency: string,
    notes: string,
    campaignRef: string,
    createdAt: number,
    minimum: number,
    status: BatchedConversionBundleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.threshold = threshold;
    this.active = active;
    this.frequencyCap = frequencyCap;
    this.ceiling = ceiling;
    this.currency = currency;
    this.notes = notes;
    this.campaignRef = campaignRef;
    this.createdAt = createdAt;
    this.minimum = minimum;
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

  canMoveTo(next: BatchedConversionBundleStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "reopened":
          case "archived":
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
        return next === "archived";
    }
    return false;
  }

  moveTo(next: BatchedConversionBundleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched conversion bundle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"batched conversion bundle"} ${this.code}`;
  }

  adjustedExposure(): number {
    return Math.round((this.threshold + this.minimum) * 100) / 100;
  }

  copy(): BatchedConversionBundle {
    return new BatchedConversionBundle(
      this.code,
      this.label,
      this.threshold,
      this.active,
      this.frequencyCap,
      this.ceiling,
      this.currency,
      this.notes,
      this.campaignRef,
      this.createdAt,
      this.minimum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a batched conversion bundle in status open. */
export function newBatchedConversionBundle(code: string, label: string): BatchedConversionBundle {
  return new BatchedConversionBundle(code, label, 0, false, 0, 0, "", "", "", 0, 0, "open");
}
