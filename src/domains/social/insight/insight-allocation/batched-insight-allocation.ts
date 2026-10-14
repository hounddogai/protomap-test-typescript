/**
 * The batched insight allocation records of social's insight work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a batched insight allocation is in its life cycle. */
export type BatchedInsightAllocationStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a batched insight allocation and its current status. */
export class BatchedInsightAllocation {
  code: string;
  label: string;
  cost: number;
  source: string;
  floorValue: number;
  status: BatchedInsightAllocationStatus;

  constructor(
    code: string,
    label: string,
    cost: number,
    source: string,
    floorValue: number,
    status: BatchedInsightAllocationStatus,
  ) {
    this.code = code;
    this.label = label;
    this.cost = cost;
    this.source = source;
    this.floorValue = floorValue;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: BatchedInsightAllocationStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted" || next === "revoked";
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: BatchedInsightAllocationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched insight allocation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"batched insight allocation"} ${this.code}`;
  }

  effectiveLoad(): number {
    return Math.round((this.cost - this.floorValue) * 100) / 100;
  }

  copy(): BatchedInsightAllocation {
    return new BatchedInsightAllocation(this.code, this.label, this.cost, this.source, this.floorValue, this.status);
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a batched insight allocation in status requested. */
export function newBatchedInsightAllocation(code: string, label: string): BatchedInsightAllocation {
  return new BatchedInsightAllocation(code, label, 0, "", 0, "requested");
}
