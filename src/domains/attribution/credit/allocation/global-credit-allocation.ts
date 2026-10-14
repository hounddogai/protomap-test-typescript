/**
 * The global credit allocation records of attribution's credit work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a global credit allocation is in its life cycle. */
export type GlobalCreditAllocationStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a global credit allocation and its current status. */
export class GlobalCreditAllocation {
  code: string;
  label: string;
  graceDays: number;
  weight: number;
  durationMinutes: number;
  status: GlobalCreditAllocationStatus;

  constructor(
    code: string,
    label: string,
    graceDays: number,
    weight: number,
    durationMinutes: number,
    status: GlobalCreditAllocationStatus,
  ) {
    this.code = code;
    this.label = label;
    this.graceDays = graceDays;
    this.weight = weight;
    this.durationMinutes = durationMinutes;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: GlobalCreditAllocationStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: GlobalCreditAllocationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global credit allocation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  weightedLoad(): number {
    return Math.round((this.durationMinutes - this.graceDays) * 100) / 100;
  }

  copy(): GlobalCreditAllocation {
    return new GlobalCreditAllocation(
      this.code,
      this.label,
      this.graceDays,
      this.weight,
      this.durationMinutes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a global credit allocation in status proposed. */
export function newGlobalCreditAllocation(code: string, label: string): GlobalCreditAllocation {
  return new GlobalCreditAllocation(code, label, 0, 0, 0, "proposed");
}
