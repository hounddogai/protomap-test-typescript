import * as text from "../../../../kit/text.js";

/** Where a batched suppression agreement is in its life cycle. */
export type BatchedSuppressionAgreementStatus = "new" | "queued" | "running" | "done" | "failed";

/** A batched suppression agreement. Its code is unique within a tenant. */
export class BatchedSuppressionAgreement {
  code: string;
  name: string;
  notes: string;
  batchSize: number;
  pinned: boolean;
  status: BatchedSuppressionAgreementStatus;

  constructor(
    code: string,
    name: string,
    notes: string,
    batchSize: number,
    pinned: boolean,
    status: BatchedSuppressionAgreementStatus,
  ) {
    this.code = code;
    this.name = name;
    this.notes = notes;
    this.batchSize = batchSize;
    this.pinned = pinned;
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

  canMoveTo(next: BatchedSuppressionAgreementStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "running":
        return next === "failed";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: BatchedSuppressionAgreementStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched suppression agreement ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  measuredValue(): number {
    return this.batchSize;
  }

  copy(): BatchedSuppressionAgreement {
    return new BatchedSuppressionAgreement(this.code, this.name, this.notes, this.batchSize, this.pinned, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a batched suppression agreement in status new. */
export function newBatchedSuppressionAgreement(code: string, name: string): BatchedSuppressionAgreement {
  return new BatchedSuppressionAgreement(code, name, "", 0, false, "new");
}
