/**
 * The capped tier allocation records of referral's tier work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a capped tier allocation is in its life cycle. */
export type CappedTierAllocationStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A capped tier allocation as the tier team keeps it. */
export class CappedTierAllocation {
  code: string;
  title: string;
  threshold: number;
  frequencyCap: number;
  locale: string;
  reviewer: string;
  ceiling: number;
  rate: number;
  source: string;
  status: CappedTierAllocationStatus;

  constructor(
    code: string,
    title: string,
    threshold: number,
    frequencyCap: number,
    locale: string,
    reviewer: string,
    ceiling: number,
    rate: number,
    source: string,
    status: CappedTierAllocationStatus,
  ) {
    this.code = code;
    this.title = title;
    this.threshold = threshold;
    this.frequencyCap = frequencyCap;
    this.locale = locale;
    this.reviewer = reviewer;
    this.ceiling = ceiling;
    this.rate = rate;
    this.source = source;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: CappedTierAllocationStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "completed" || next === "cancelled";
      case "scheduled":
        return next === "cancelled";
      case "in_progress":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: CappedTierAllocationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped tier allocation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  effectiveTotal(): number {
    return Math.round(this.ceiling * this.frequencyCap * 100) / 100;
  }

  copy(): CappedTierAllocation {
    return new CappedTierAllocation(
      this.code,
      this.title,
      this.threshold,
      this.frequencyCap,
      this.locale,
      this.reviewer,
      this.ceiling,
      this.rate,
      this.source,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a capped tier allocation in status planned. */
export function newCappedTierAllocation(code: string, title: string): CappedTierAllocation {
  return new CappedTierAllocation(code, title, 0, 0, "", "", 0, 0, "", "planned");
}
