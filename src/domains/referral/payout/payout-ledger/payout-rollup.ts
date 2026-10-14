import * as text from "../../../../kit/text.js";

/** Where a payout rollup is in its life cycle. */
export type PayoutRollupStatus = "new" | "queued" | "running" | "done" | "failed";

/** A payout rollup as the payout team keeps it. */
export class PayoutRollup {
  code: string;
  label: string;
  rate: number;
  timezone: string;
  source: string;
  capacity: number;
  status: PayoutRollupStatus;

  constructor(
    code: string,
    label: string,
    rate: number,
    timezone: string,
    source: string,
    capacity: number,
    status: PayoutRollupStatus,
  ) {
    this.code = code;
    this.label = label;
    this.rate = rate;
    this.timezone = timezone;
    this.source = source;
    this.capacity = capacity;
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

  canMoveTo(next: PayoutRollupStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
          case "done":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "running":
          case "done":
            return true;
        }
        return false;
      case "running":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: PayoutRollupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`payout rollup ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"payout rollup"} ${this.code}`;
  }

  effectiveExposure(): number {
    return Math.round(this.capacity * this.rate * 100) / 100;
  }

  copy(): PayoutRollup {
    return new PayoutRollup(this.code, this.label, this.rate, this.timezone, this.source, this.capacity, this.status);
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a payout rollup in status new. */
export function newPayoutRollup(code: string, label: string): PayoutRollup {
  return new PayoutRollup(code, label, 0, "", "", 0, "new");
}
