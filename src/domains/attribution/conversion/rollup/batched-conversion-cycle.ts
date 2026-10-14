import * as text from "../../../../kit/text.js";

/** Where a batched conversion cycle is in its life cycle. */
export type BatchedConversionCycleStatus = "created" | "validated" | "published" | "retired";

/** The record of a batched conversion cycle and its current status. */
export class BatchedConversionCycle {
  code: string;
  label: string;
  ceiling: number;
  bid: number;
  cohort: string;
  contactEmail: string;
  amount: number;
  country: string;
  status: BatchedConversionCycleStatus;

  constructor(
    code: string,
    label: string,
    ceiling: number,
    bid: number,
    cohort: string,
    contactEmail: string,
    amount: number,
    country: string,
    status: BatchedConversionCycleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.ceiling = ceiling;
    this.bid = bid;
    this.cohort = cohort;
    this.contactEmail = contactEmail;
    this.amount = amount;
    this.country = country;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: BatchedConversionCycleStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: BatchedConversionCycleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched conversion cycle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  projectedValue(): number {
    return Math.round((this.bid - this.ceiling) * 100) / 100;
  }

  copy(): BatchedConversionCycle {
    return new BatchedConversionCycle(
      this.code,
      this.label,
      this.ceiling,
      this.bid,
      this.cohort,
      this.contactEmail,
      this.amount,
      this.country,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a batched conversion cycle in status created. */
export function newBatchedConversionCycle(code: string, label: string): BatchedConversionCycle {
  return new BatchedConversionCycle(code, label, 0, 0, "", "", 0, "", "created");
}
