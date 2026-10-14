import * as text from "../../../../kit/text.js";

/** Where a batched credit record is in its life cycle. */
export type BatchedCreditRecordStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A batched credit record as the credit team keeps it. */
export class BatchedCreditRecord {
  code: string;
  title: string;
  discount: number;
  reviewer: string;
  budget: number;
  status: BatchedCreditRecordStatus;

  constructor(
    code: string,
    title: string,
    discount: number,
    reviewer: string,
    budget: number,
    status: BatchedCreditRecordStatus,
  ) {
    this.code = code;
    this.title = title;
    this.discount = discount;
    this.reviewer = reviewer;
    this.budget = budget;
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

  canMoveTo(next: BatchedCreditRecordStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "pending":
        return next === "suspended";
      case "active":
        return next === "suspended";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: BatchedCreditRecordStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched credit record ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"batched credit record"} ${this.code}`;
  }

  netLoad(): number {
    return Math.round(this.discount * this.budget * 100) / 100;
  }

  copy(): BatchedCreditRecord {
    return new BatchedCreditRecord(this.code, this.title, this.discount, this.reviewer, this.budget, this.status);
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a batched credit record in status draft. */
export function newBatchedCreditRecord(code: string, title: string): BatchedCreditRecord {
  return new BatchedCreditRecord(code, title, 0, "", 0, "draft");
}
