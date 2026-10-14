/**
 * The enrollment mapping records of journeys's enrollment work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a enrollment mapping is in its life cycle. */
export type EnrollmentMappingStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One enrollment mapping, with what the planners need to act on it. */
export class EnrollmentMapping {
  code: string;
  title: string;
  windowDays: number;
  cost: number;
  capacity: number;
  audienceId: string;
  startsAt: number;
  approved: boolean;
  discount: number;
  active: boolean;
  status: EnrollmentMappingStatus;

  constructor(
    code: string,
    title: string,
    windowDays: number,
    cost: number,
    capacity: number,
    audienceId: string,
    startsAt: number,
    approved: boolean,
    discount: number,
    active: boolean,
    status: EnrollmentMappingStatus,
  ) {
    this.code = code;
    this.title = title;
    this.windowDays = windowDays;
    this.cost = cost;
    this.capacity = capacity;
    this.audienceId = audienceId;
    this.startsAt = startsAt;
    this.approved = approved;
    this.discount = discount;
    this.active = active;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: EnrollmentMappingStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: EnrollmentMappingStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`enrollment mapping ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"enrollment mapping"} ${this.code}`;
  }

  effectiveTotal(): number {
    return Math.round((this.discount - this.windowDays) * 100) / 100;
  }

  copy(): EnrollmentMapping {
    return new EnrollmentMapping(
      this.code,
      this.title,
      this.windowDays,
      this.cost,
      this.capacity,
      this.audienceId,
      this.startsAt,
      this.approved,
      this.discount,
      this.active,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a enrollment mapping in status proposed. */
export function newEnrollmentMapping(code: string, title: string): EnrollmentMapping {
  return new EnrollmentMapping(code, title, 0, 0, 0, "", 0, false, 0, false, "proposed");
}
