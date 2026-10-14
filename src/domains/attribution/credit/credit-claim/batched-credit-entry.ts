import * as text from "../../../../kit/text.js";

/** Where a batched credit entry is in its life cycle. */
export type BatchedCreditEntryStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One batched credit entry, with what the planners need to act on it. */
export class BatchedCreditEntry {
  code: string;
  label: string;
  weight: number;
  attempts: number;
  currency: string;
  name: string;
  status: BatchedCreditEntryStatus;

  constructor(
    code: string,
    label: string,
    weight: number,
    attempts: number,
    currency: string,
    name: string,
    status: BatchedCreditEntryStatus,
  ) {
    this.code = code;
    this.label = label;
    this.weight = weight;
    this.attempts = attempts;
    this.currency = currency;
    this.name = name;
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

  canMoveTo(next: BatchedCreditEntryStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "in_progress":
            return true;
        }
        return false;
      case "scheduled":
        return next === "cancelled";
      case "in_progress":
        return next === "completed";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: BatchedCreditEntryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched credit entry ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  weightedValue(): number {
    return Math.round((this.attempts - this.weight) * 100) / 100;
  }

  copy(): BatchedCreditEntry {
    return new BatchedCreditEntry(
      this.code,
      this.label,
      this.weight,
      this.attempts,
      this.currency,
      this.name,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a batched credit entry in status planned. */
export function newBatchedCreditEntry(code: string, label: string): BatchedCreditEntry {
  return new BatchedCreditEntry(code, label, 0, 0, "", "", "planned");
}
