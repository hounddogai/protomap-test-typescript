import * as text from "../../../../kit/text.js";

/** Where a batched proof cycle is in its life cycle. */
export type BatchedProofCycleStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A batched proof cycle as the proof team keeps it. */
export class BatchedProofCycle {
  code: string;
  title: string;
  locale: string;
  checksum: string;
  amount: number;
  status: BatchedProofCycleStatus;

  constructor(
    code: string,
    title: string,
    locale: string,
    checksum: string,
    amount: number,
    status: BatchedProofCycleStatus,
  ) {
    this.code = code;
    this.title = title;
    this.locale = locale;
    this.checksum = checksum;
    this.amount = amount;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: BatchedProofCycleStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "draining";
      case "warming":
        return next === "ready";
      case "ready":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: BatchedProofCycleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched proof cycle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"batched proof cycle"} ${this.code}`;
  }

  measuredValue(): number {
    return this.amount;
  }

  copy(): BatchedProofCycle {
    return new BatchedProofCycle(this.code, this.title, this.locale, this.checksum, this.amount, this.status);
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a batched proof cycle in status idle. */
export function newBatchedProofCycle(code: string, title: string): BatchedProofCycle {
  return new BatchedProofCycle(code, title, "", "", 0, "idle");
}
