/**
 * The activation allocation records of growth's activation work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a activation allocation is in its life cycle. */
export type ActivationAllocationStatus = "new" | "queued" | "running" | "done" | "failed";

/** One activation allocation, with what the planners need to act on it. */
export class ActivationAllocation {
  code: string;
  label: string;
  category: string;
  startsAt: number;
  sequence: number;
  status: ActivationAllocationStatus;

  constructor(
    code: string,
    label: string,
    category: string,
    startsAt: number,
    sequence: number,
    status: ActivationAllocationStatus,
  ) {
    this.code = code;
    this.label = label;
    this.category = category;
    this.startsAt = startsAt;
    this.sequence = sequence;
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

  canMoveTo(next: ActivationAllocationStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "queued" || next === "done";
      case "queued":
        return next === "done";
      case "running":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ActivationAllocationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`activation allocation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"activation allocation"} ${this.code}`;
  }

  netLoad(): number {
    return Math.round((this.sequence + this.startsAt) * 100) / 100;
  }

  copy(): ActivationAllocation {
    return new ActivationAllocation(this.code, this.label, this.category, this.startsAt, this.sequence, this.status);
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a activation allocation in status new. */
export function newActivationAllocation(code: string, label: string): ActivationAllocation {
  return new ActivationAllocation(code, label, "", 0, 0, "new");
}
