import * as text from "../../../../kit/text.js";

/** Where a fallback retention batch is in its life cycle. */
export type FallbackRetentionBatchStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A fallback retention batch. Its code is unique within a tenant. */
export class FallbackRetentionBatch {
  code: string;
  label: string;
  campaignRef: string;
  rate: number;
  segment: string;
  status: FallbackRetentionBatchStatus;

  constructor(
    code: string,
    label: string,
    campaignRef: string,
    rate: number,
    segment: string,
    status: FallbackRetentionBatchStatus,
  ) {
    this.code = code;
    this.label = label;
    this.campaignRef = campaignRef;
    this.rate = rate;
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

  canMoveTo(next: FallbackRetentionBatchStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "in_progress" || next === "cancelled";
      case "scheduled":
        switch (next) {
          case "in_progress":
          case "completed":
            return true;
        }
        return false;
      case "in_progress":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: FallbackRetentionBatchStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback retention batch ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"fallback retention batch"} ${this.code}`;
  }

  measuredValue(): number {
    return this.rate;
  }

  copy(): FallbackRetentionBatch {
    return new FallbackRetentionBatch(this.code, this.label, this.campaignRef, this.rate, this.segment, this.status);
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a fallback retention batch in status planned. */
export function newFallbackRetentionBatch(code: string, label: string): FallbackRetentionBatch {
  return new FallbackRetentionBatch(code, label, "", 0, "", "planned");
}
