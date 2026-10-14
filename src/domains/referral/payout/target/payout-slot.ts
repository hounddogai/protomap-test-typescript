import * as text from "../../../../kit/text.js";

/** Where a payout slot is in its life cycle. */
export type PayoutSlotStatus = "new" | "queued" | "running" | "done" | "failed";

/** One payout slot, with what the planners need to act on it. */
export class PayoutSlot {
  code: string;
  label: string;
  graceDays: number;
  segment: string;
  cohort: string;
  status: PayoutSlotStatus;

  constructor(
    code: string,
    label: string,
    graceDays: number,
    segment: string,
    cohort: string,
    status: PayoutSlotStatus,
  ) {
    this.code = code;
    this.label = label;
    this.graceDays = graceDays;
    this.segment = segment;
    this.cohort = cohort;
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

  canMoveTo(next: PayoutSlotStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "running":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "running":
          case "failed":
            return true;
        }
        return false;
      case "running":
        return next === "done" || next === "failed";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PayoutSlotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`payout slot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  measuredValue(): number {
    return this.graceDays;
  }

  copy(): PayoutSlot {
    return new PayoutSlot(this.code, this.label, this.graceDays, this.segment, this.cohort, this.status);
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a payout slot in status new. */
export function newPayoutSlot(code: string, label: string): PayoutSlot {
  return new PayoutSlot(code, label, 0, "", "", "new");
}
