/**
 * The lenient macro estimate records of support's macro work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a lenient macro estimate is in its life cycle. */
export type LenientMacroEstimateStatus = "created" | "validated" | "published" | "retired";

/** One lenient macro estimate, with what the planners need to act on it. */
export class LenientMacroEstimate {
  code: string;
  name: string;
  capacity: number;
  campaignRef: string;
  weight: number;
  status: LenientMacroEstimateStatus;

  constructor(
    code: string,
    name: string,
    capacity: number,
    campaignRef: string,
    weight: number,
    status: LenientMacroEstimateStatus,
  ) {
    this.code = code;
    this.name = name;
    this.capacity = capacity;
    this.campaignRef = campaignRef;
    this.weight = weight;
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

  canMoveTo(next: LenientMacroEstimateStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated";
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: LenientMacroEstimateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient macro estimate ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  weightedTotal(): number {
    return Math.round((this.capacity + this.weight) * 100) / 100;
  }

  copy(): LenientMacroEstimate {
    return new LenientMacroEstimate(this.code, this.name, this.capacity, this.campaignRef, this.weight, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a lenient macro estimate in status created. */
export function newLenientMacroEstimate(code: string, name: string): LenientMacroEstimate {
  return new LenientMacroEstimate(code, name, 0, "", 0, "created");
}
