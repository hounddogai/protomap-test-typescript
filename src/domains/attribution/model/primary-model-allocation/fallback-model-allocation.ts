/**
 * The fallback model allocation records of attribution's model work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a fallback model allocation is in its life cycle. */
export type FallbackModelAllocationStatus = "new" | "queued" | "running" | "done" | "failed";

/** A fallback model allocation. Its code is unique within a tenant. */
export class FallbackModelAllocation {
  code: string;
  label: string;
  description: string;
  region: string;
  externalRef: string;
  cost: number;
  floorValue: number;
  durationMinutes: number;
  status: FallbackModelAllocationStatus;

  constructor(
    code: string,
    label: string,
    description: string,
    region: string,
    externalRef: string,
    cost: number,
    floorValue: number,
    durationMinutes: number,
    status: FallbackModelAllocationStatus,
  ) {
    this.code = code;
    this.label = label;
    this.description = description;
    this.region = region;
    this.externalRef = externalRef;
    this.cost = cost;
    this.floorValue = floorValue;
    this.durationMinutes = durationMinutes;
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

  canMoveTo(next: FallbackModelAllocationStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "done";
      case "queued":
        return next === "failed";
      case "running":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: FallbackModelAllocationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback model allocation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"fallback model allocation"} ${this.code}`;
  }

  adjustedExposure(): number {
    return Math.round((this.durationMinutes - this.cost) * 100) / 100;
  }

  copy(): FallbackModelAllocation {
    return new FallbackModelAllocation(
      this.code,
      this.label,
      this.description,
      this.region,
      this.externalRef,
      this.cost,
      this.floorValue,
      this.durationMinutes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a fallback model allocation in status new. */
export function newFallbackModelAllocation(code: string, label: string): FallbackModelAllocation {
  return new FallbackModelAllocation(code, label, "", "", "", 0, 0, 0, "new");
}
