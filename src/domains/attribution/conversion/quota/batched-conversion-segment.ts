import * as text from "../../../../kit/text.js";

/** Where a batched conversion segment is in its life cycle. */
export type BatchedConversionSegmentStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A batched conversion segment. Its code is unique within a tenant. */
export class BatchedConversionSegment {
  code: string;
  label: string;
  active: boolean;
  country: string;
  rate: number;
  priority: number;
  description: string;
  status: BatchedConversionSegmentStatus;

  constructor(
    code: string,
    label: string,
    active: boolean,
    country: string,
    rate: number,
    priority: number,
    description: string,
    status: BatchedConversionSegmentStatus,
  ) {
    this.code = code;
    this.label = label;
    this.active = active;
    this.country = country;
    this.rate = rate;
    this.priority = priority;
    this.description = description;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: BatchedConversionSegmentStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
            return true;
        }
        return false;
      case "approved":
        switch (next) {
          case "rejected":
            return true;
        }
        return false;
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: BatchedConversionSegmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched conversion segment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  weightedTotal(): number {
    return Math.round((this.priority - this.rate) * 100) / 100;
  }

  copy(): BatchedConversionSegment {
    return new BatchedConversionSegment(
      this.code,
      this.label,
      this.active,
      this.country,
      this.rate,
      this.priority,
      this.description,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a batched conversion segment in status proposed. */
export function newBatchedConversionSegment(code: string, label: string): BatchedConversionSegment {
  return new BatchedConversionSegment(code, label, false, "", 0, 0, "", "proposed");
}
