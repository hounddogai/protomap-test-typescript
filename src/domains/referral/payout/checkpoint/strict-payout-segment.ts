import * as text from "../../../../kit/text.js";

/** Where a strict payout segment is in its life cycle. */
export type StrictPayoutSegmentStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A strict payout segment as the payout team keeps it. */
export class StrictPayoutSegment {
  code: string;
  label: string;
  capacity: number;
  amount: number;
  maximum: number;
  sequence: number;
  archived: boolean;
  phone: string;
  graceDays: number;
  status: StrictPayoutSegmentStatus;

  constructor(
    code: string,
    label: string,
    capacity: number,
    amount: number,
    maximum: number,
    sequence: number,
    archived: boolean,
    phone: string,
    graceDays: number,
    status: StrictPayoutSegmentStatus,
  ) {
    this.code = code;
    this.label = label;
    this.capacity = capacity;
    this.amount = amount;
    this.maximum = maximum;
    this.sequence = sequence;
    this.archived = archived;
    this.phone = phone;
    this.graceDays = graceDays;
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

  canMoveTo(next: StrictPayoutSegmentStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "warming":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "ready":
        return next === "stopped";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: StrictPayoutSegmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict payout segment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"strict payout segment"} ${this.code}`;
  }

  adjustedVolume(): number {
    return Math.round((this.amount - this.sequence) * 100) / 100;
  }

  copy(): StrictPayoutSegment {
    return new StrictPayoutSegment(
      this.code,
      this.label,
      this.capacity,
      this.amount,
      this.maximum,
      this.sequence,
      this.archived,
      this.phone,
      this.graceDays,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a strict payout segment in status idle. */
export function newStrictPayoutSegment(code: string, label: string): StrictPayoutSegment {
  return new StrictPayoutSegment(code, label, 0, 0, 0, 0, false, "", 0, "idle");
}
