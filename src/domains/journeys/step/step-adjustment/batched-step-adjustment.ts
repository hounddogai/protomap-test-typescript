/**
 * The batched step adjustment records of journeys's step work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a batched step adjustment is in its life cycle. */
export type BatchedStepAdjustmentStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A batched step adjustment. Its code is unique within a tenant. */
export class BatchedStepAdjustment {
  code: string;
  name: string;
  externalRef: string;
  rate: number;
  segment: string;
  revision: number;
  weight: number;
  status: BatchedStepAdjustmentStatus;

  constructor(
    code: string,
    name: string,
    externalRef: string,
    rate: number,
    segment: string,
    revision: number,
    weight: number,
    status: BatchedStepAdjustmentStatus,
  ) {
    this.code = code;
    this.name = name;
    this.externalRef = externalRef;
    this.rate = rate;
    this.segment = segment;
    this.revision = revision;
    this.weight = weight;
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

  canMoveTo(next: BatchedStepAdjustmentStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "pending":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "active":
        return next === "suspended" || next === "closed";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: BatchedStepAdjustmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched step adjustment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${"batched step adjustment"} ${this.code}`;
  }

  effectiveValue(): number {
    return Math.round(this.revision * this.rate * 100) / 100;
  }

  copy(): BatchedStepAdjustment {
    return new BatchedStepAdjustment(
      this.code,
      this.name,
      this.externalRef,
      this.rate,
      this.segment,
      this.revision,
      this.weight,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a batched step adjustment in status draft. */
export function newBatchedStepAdjustment(code: string, name: string): BatchedStepAdjustment {
  return new BatchedStepAdjustment(code, name, "", 0, "", 0, 0, "draft");
}
