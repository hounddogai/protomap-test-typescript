/**
 * The tiered bounce allocation records of deliverability's bounce work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a tiered bounce allocation is in its life cycle. */
export type TieredBounceAllocationStatus = "new" | "queued" | "running" | "done" | "failed";

/** A tiered bounce allocation as the bounce team keeps it. */
export class TieredBounceAllocation {
  code: string;
  name: string;
  retries: number;
  reviewer: string;
  campaignRef: string;
  status: TieredBounceAllocationStatus;

  constructor(
    code: string,
    name: string,
    retries: number,
    reviewer: string,
    campaignRef: string,
    status: TieredBounceAllocationStatus,
  ) {
    this.code = code;
    this.name = name;
    this.retries = retries;
    this.reviewer = reviewer;
    this.campaignRef = campaignRef;
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

  canMoveTo(next: TieredBounceAllocationStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "running";
      case "queued":
        switch (next) {
          case "running":
          case "failed":
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

  moveTo(next: TieredBounceAllocationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered bounce allocation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  measuredValue(): number {
    return this.retries;
  }

  copy(): TieredBounceAllocation {
    return new TieredBounceAllocation(this.code, this.name, this.retries, this.reviewer, this.campaignRef, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a tiered bounce allocation in status new. */
export function newTieredBounceAllocation(code: string, name: string): TieredBounceAllocation {
  return new TieredBounceAllocation(code, name, 0, "", "", "new");
}
