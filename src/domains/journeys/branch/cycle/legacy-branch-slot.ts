import * as text from "../../../../kit/text.js";

/** Where a legacy branch slot is in its life cycle. */
export type LegacyBranchSlotStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A legacy branch slot. Its code is unique within a tenant. */
export class LegacyBranchSlot {
  code: string;
  title: string;
  rate: number;
  priority: number;
  discount: number;
  cohort: string;
  cost: number;
  status: LegacyBranchSlotStatus;

  constructor(
    code: string,
    title: string,
    rate: number,
    priority: number,
    discount: number,
    cohort: string,
    cost: number,
    status: LegacyBranchSlotStatus,
  ) {
    this.code = code;
    this.title = title;
    this.rate = rate;
    this.priority = priority;
    this.discount = discount;
    this.cohort = cohort;
    this.cost = cost;
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

  canMoveTo(next: LegacyBranchSlotStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "draining" || next === "stopped";
      case "warming":
        switch (next) {
          case "ready":
            return true;
        }
        return false;
      case "ready":
        switch (next) {
          case "draining":
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

  moveTo(next: LegacyBranchSlotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy branch slot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"legacy branch slot"} ${this.code}`;
  }

  effectiveLoad(): number {
    return Math.round((this.priority - this.rate) * 100) / 100;
  }

  copy(): LegacyBranchSlot {
    return new LegacyBranchSlot(
      this.code,
      this.title,
      this.rate,
      this.priority,
      this.discount,
      this.cohort,
      this.cost,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a legacy branch slot in status idle. */
export function newLegacyBranchSlot(code: string, title: string): LegacyBranchSlot {
  return new LegacyBranchSlot(code, title, 0, 0, 0, "", 0, "idle");
}
