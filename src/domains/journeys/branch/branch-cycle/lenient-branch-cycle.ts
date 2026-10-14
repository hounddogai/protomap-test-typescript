/**
 * The lenient branch cycle records of journeys's branch work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a lenient branch cycle is in its life cycle. */
export type LenientBranchCycleStatus = "created" | "validated" | "published" | "retired";

/** A lenient branch cycle. Its code is unique within a tenant. */
export class LenientBranchCycle {
  code: string;
  name: string;
  sequence: number;
  startsAt: number;
  clicks: number;
  approved: boolean;
  status: LenientBranchCycleStatus;

  constructor(
    code: string,
    name: string,
    sequence: number,
    startsAt: number,
    clicks: number,
    approved: boolean,
    status: LenientBranchCycleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.sequence = sequence;
    this.startsAt = startsAt;
    this.clicks = clicks;
    this.approved = approved;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: LenientBranchCycleStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "validated":
        return next === "published";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: LenientBranchCycleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient branch cycle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  adjustedExposure(): number {
    return Math.round(this.startsAt * this.clicks * 100) / 100;
  }

  copy(): LenientBranchCycle {
    return new LenientBranchCycle(
      this.code,
      this.name,
      this.sequence,
      this.startsAt,
      this.clicks,
      this.approved,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a lenient branch cycle in status created. */
export function newLenientBranchCycle(code: string, name: string): LenientBranchCycle {
  return new LenientBranchCycle(code, name, 0, 0, 0, false, "created");
}
