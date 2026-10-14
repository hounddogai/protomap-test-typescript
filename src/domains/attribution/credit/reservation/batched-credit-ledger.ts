import * as text from "../../../../kit/text.js";

/** Where a batched credit ledger is in its life cycle. */
export type BatchedCreditLedgerStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A batched credit ledger as the credit team keeps it. */
export class BatchedCreditLedger {
  code: string;
  label: string;
  notes: string;
  approved: boolean;
  updatedAt: number;
  ceiling: number;
  createdAt: number;
  maximum: number;
  sequence: number;
  currency: string;
  attempts: number;
  status: BatchedCreditLedgerStatus;

  constructor(
    code: string,
    label: string,
    notes: string,
    approved: boolean,
    updatedAt: number,
    ceiling: number,
    createdAt: number,
    maximum: number,
    sequence: number,
    currency: string,
    attempts: number,
    status: BatchedCreditLedgerStatus,
  ) {
    this.code = code;
    this.label = label;
    this.notes = notes;
    this.approved = approved;
    this.updatedAt = updatedAt;
    this.ceiling = ceiling;
    this.createdAt = createdAt;
    this.maximum = maximum;
    this.sequence = sequence;
    this.currency = currency;
    this.attempts = attempts;
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

  canMoveTo(next: BatchedCreditLedgerStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "pending":
        return next === "active" || next === "suspended";
      case "active":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: BatchedCreditLedgerStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched credit ledger ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  effectiveValue(): number {
    return Math.round(this.updatedAt * this.maximum * 100) / 100;
  }

  copy(): BatchedCreditLedger {
    return new BatchedCreditLedger(
      this.code,
      this.label,
      this.notes,
      this.approved,
      this.updatedAt,
      this.ceiling,
      this.createdAt,
      this.maximum,
      this.sequence,
      this.currency,
      this.attempts,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a batched credit ledger in status draft. */
export function newBatchedCreditLedger(code: string, label: string): BatchedCreditLedger {
  return new BatchedCreditLedger(code, label, "", false, 0, 0, 0, 0, 0, "", 0, "draft");
}
