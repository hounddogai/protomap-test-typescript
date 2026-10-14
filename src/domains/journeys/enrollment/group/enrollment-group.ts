/**
 * The enrollment group records of journeys's enrollment work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a enrollment group is in its life cycle. */
export type EnrollmentGroupStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a enrollment group and its current status. */
export class EnrollmentGroup {
  code: string;
  name: string;
  frequencyCap: number;
  ratio: number;
  reviewer: string;
  minimum: number;
  active: boolean;
  status: EnrollmentGroupStatus;

  constructor(
    code: string,
    name: string,
    frequencyCap: number,
    ratio: number,
    reviewer: string,
    minimum: number,
    active: boolean,
    status: EnrollmentGroupStatus,
  ) {
    this.code = code;
    this.name = name;
    this.frequencyCap = frequencyCap;
    this.ratio = ratio;
    this.reviewer = reviewer;
    this.minimum = minimum;
    this.active = active;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: EnrollmentGroupStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "pending":
          case "active":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "active":
        return next === "suspended" || next === "closed";
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: EnrollmentGroupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`enrollment group ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  adjustedTotal(): number {
    return Math.round(this.minimum * this.ratio * 100) / 100;
  }

  copy(): EnrollmentGroup {
    return new EnrollmentGroup(
      this.code,
      this.name,
      this.frequencyCap,
      this.ratio,
      this.reviewer,
      this.minimum,
      this.active,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a enrollment group in status draft. */
export function newEnrollmentGroup(code: string, name: string): EnrollmentGroup {
  return new EnrollmentGroup(code, name, 0, 0, "", 0, false, "draft");
}
