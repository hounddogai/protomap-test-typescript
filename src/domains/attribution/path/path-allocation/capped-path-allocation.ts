/**
 * The capped path allocation records of attribution's path work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a capped path allocation is in its life cycle. */
export type CappedPathAllocationStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a capped path allocation and its current status. */
export class CappedPathAllocation {
  code: string;
  name: string;
  rate: number;
  frequencyCap: number;
  maximum: number;
  floorValue: number;
  status: CappedPathAllocationStatus;

  constructor(
    code: string,
    name: string,
    rate: number,
    frequencyCap: number,
    maximum: number,
    floorValue: number,
    status: CappedPathAllocationStatus,
  ) {
    this.code = code;
    this.name = name;
    this.rate = rate;
    this.frequencyCap = frequencyCap;
    this.maximum = maximum;
    this.floorValue = floorValue;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: CappedPathAllocationStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "in_review":
            return true;
        }
        return false;
      case "in_review":
        return next === "resolved";
      case "resolved":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: CappedPathAllocationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped path allocation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  projectedLoad(): number {
    return Math.round(this.maximum * this.floorValue * 100) / 100;
  }

  copy(): CappedPathAllocation {
    return new CappedPathAllocation(
      this.code,
      this.name,
      this.rate,
      this.frequencyCap,
      this.maximum,
      this.floorValue,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a capped path allocation in status open. */
export function newCappedPathAllocation(code: string, name: string): CappedPathAllocation {
  return new CappedPathAllocation(code, name, 0, 0, 0, 0, "open");
}
