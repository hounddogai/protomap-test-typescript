/**
 * The fallback activation allocation records of growth's activation work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a fallback activation allocation is in its life cycle. */
export type FallbackActivationAllocationStatus = "new" | "queued" | "running" | "done" | "failed";

/** A fallback activation allocation as the activation team keeps it. */
export class FallbackActivationAllocation {
  code: string;
  title: string;
  approved: boolean;
  budget: number;
  durationMinutes: number;
  revision: number;
  region: string;
  status: FallbackActivationAllocationStatus;

  constructor(
    code: string,
    title: string,
    approved: boolean,
    budget: number,
    durationMinutes: number,
    revision: number,
    region: string,
    status: FallbackActivationAllocationStatus,
  ) {
    this.code = code;
    this.title = title;
    this.approved = approved;
    this.budget = budget;
    this.durationMinutes = durationMinutes;
    this.revision = revision;
    this.region = region;
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

  canMoveTo(next: FallbackActivationAllocationStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "running" || next === "failed";
      case "queued":
        return next === "done";
      case "running":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: FallbackActivationAllocationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback activation allocation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  weightedVolume(): number {
    return Math.round((this.budget - this.revision) * 100) / 100;
  }

  copy(): FallbackActivationAllocation {
    return new FallbackActivationAllocation(
      this.code,
      this.title,
      this.approved,
      this.budget,
      this.durationMinutes,
      this.revision,
      this.region,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a fallback activation allocation in status new. */
export function newFallbackActivationAllocation(code: string, title: string): FallbackActivationAllocation {
  return new FallbackActivationAllocation(code, title, false, 0, 0, 0, "", "new");
}
