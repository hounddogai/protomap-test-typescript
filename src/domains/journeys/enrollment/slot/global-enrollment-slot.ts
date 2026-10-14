/**
 * The global enrollment slot records of journeys's enrollment work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a global enrollment slot is in its life cycle. */
export type GlobalEnrollmentSlotStatus = "created" | "validated" | "published" | "retired";

/** One global enrollment slot, with what the planners need to act on it. */
export class GlobalEnrollmentSlot {
  code: string;
  title: string;
  externalRef: string;
  budget: number;
  ownerId: string;
  retries: number;
  status: GlobalEnrollmentSlotStatus;

  constructor(
    code: string,
    title: string,
    externalRef: string,
    budget: number,
    ownerId: string,
    retries: number,
    status: GlobalEnrollmentSlotStatus,
  ) {
    this.code = code;
    this.title = title;
    this.externalRef = externalRef;
    this.budget = budget;
    this.ownerId = ownerId;
    this.retries = retries;
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

  canMoveTo(next: GlobalEnrollmentSlotStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "published" || next === "retired";
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: GlobalEnrollmentSlotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global enrollment slot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  adjustedTotal(): number {
    return Math.round((this.budget - this.retries) * 100) / 100;
  }

  copy(): GlobalEnrollmentSlot {
    return new GlobalEnrollmentSlot(
      this.code,
      this.title,
      this.externalRef,
      this.budget,
      this.ownerId,
      this.retries,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a global enrollment slot in status created. */
export function newGlobalEnrollmentSlot(code: string, title: string): GlobalEnrollmentSlot {
  return new GlobalEnrollmentSlot(code, title, "", 0, "", 0, "created");
}
