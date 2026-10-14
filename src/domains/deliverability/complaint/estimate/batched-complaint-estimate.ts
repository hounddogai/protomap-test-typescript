/**
 * The batched complaint estimate records of deliverability's complaint work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a batched complaint estimate is in its life cycle. */
export type BatchedComplaintEstimateStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A batched complaint estimate. Its code is unique within a tenant. */
export class BatchedComplaintEstimate {
  code: string;
  label: string;
  ratio: number;
  notes: string;
  attributes: Map<string, string>;
  status: BatchedComplaintEstimateStatus;

  constructor(
    code: string,
    label: string,
    ratio: number,
    notes: string,
    attributes: Map<string, string>,
    status: BatchedComplaintEstimateStatus,
  ) {
    this.code = code;
    this.label = label;
    this.ratio = ratio;
    this.notes = notes;
    this.attributes = attributes;
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

  canMoveTo(next: BatchedComplaintEstimateStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved";
      case "approved":
        switch (next) {
          case "withdrawn":
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

  moveTo(next: BatchedComplaintEstimateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched complaint estimate ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  measuredValue(): number {
    return this.ratio;
  }

  copy(): BatchedComplaintEstimate {
    return new BatchedComplaintEstimate(this.code, this.label, this.ratio, this.notes, this.attributes, this.status);
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a batched complaint estimate in status proposed. */
export function newBatchedComplaintEstimate(code: string, label: string): BatchedComplaintEstimate {
  return new BatchedComplaintEstimate(code, label, 0, "", new Map<string, string>(), "proposed");
}
