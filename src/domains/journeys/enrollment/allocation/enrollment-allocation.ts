/**
 * The enrollment allocation records of journeys's enrollment work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a enrollment allocation is in its life cycle. */
export type EnrollmentAllocationStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a enrollment allocation and its current status. */
export class EnrollmentAllocation {
  code: string;
  title: string;
  conversionRate: number;
  approved: boolean;
  archived: boolean;
  channel: string;
  graceDays: number;
  capacity: number;
  status: EnrollmentAllocationStatus;

  constructor(
    code: string,
    title: string,
    conversionRate: number,
    approved: boolean,
    archived: boolean,
    channel: string,
    graceDays: number,
    capacity: number,
    status: EnrollmentAllocationStatus,
  ) {
    this.code = code;
    this.title = title;
    this.conversionRate = conversionRate;
    this.approved = approved;
    this.archived = archived;
    this.channel = channel;
    this.graceDays = graceDays;
    this.capacity = capacity;
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

  canMoveTo(next: EnrollmentAllocationStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "scheduled";
      case "scheduled":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "in_progress":
        switch (next) {
          case "completed":
          case "cancelled":
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

  moveTo(next: EnrollmentAllocationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`enrollment allocation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  effectiveLoad(): number {
    return Math.round(this.conversionRate * this.graceDays * 100) / 100;
  }

  copy(): EnrollmentAllocation {
    return new EnrollmentAllocation(
      this.code,
      this.title,
      this.conversionRate,
      this.approved,
      this.archived,
      this.channel,
      this.graceDays,
      this.capacity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a enrollment allocation in status planned. */
export function newEnrollmentAllocation(code: string, title: string): EnrollmentAllocation {
  return new EnrollmentAllocation(code, title, 0, false, false, "", 0, 0, "planned");
}
