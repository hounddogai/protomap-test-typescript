import * as text from "../../../../kit/text.js";

/** Where a bid rule batch is in its life cycle. */
export type BidRuleBatchStatus = "created" | "validated" | "published" | "retired";

/** A bid rule batch. Its code is unique within a tenant. */
export class BidRuleBatch {
  code: string;
  label: string;
  bid: number;
  notes: string;
  sequence: number;
  margin: number;
  frequencyCap: number;
  status: BidRuleBatchStatus;

  constructor(
    code: string,
    label: string,
    bid: number,
    notes: string,
    sequence: number,
    margin: number,
    frequencyCap: number,
    status: BidRuleBatchStatus,
  ) {
    this.code = code;
    this.label = label;
    this.bid = bid;
    this.notes = notes;
    this.sequence = sequence;
    this.margin = margin;
    this.frequencyCap = frequencyCap;
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

  canMoveTo(next: BidRuleBatchStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: BidRuleBatchStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`bid rule batch ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  adjustedValue(): number {
    return Math.round(this.sequence * this.margin * 100) / 100;
  }

  copy(): BidRuleBatch {
    return new BidRuleBatch(
      this.code,
      this.label,
      this.bid,
      this.notes,
      this.sequence,
      this.margin,
      this.frequencyCap,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a bid rule batch in status created. */
export function newBidRuleBatch(code: string, label: string): BidRuleBatch {
  return new BidRuleBatch(code, label, 0, "", 0, 0, 0, "created");
}
