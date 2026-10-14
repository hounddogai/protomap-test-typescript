/**
 * The deflection assignment records of support's deflection work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a deflection assignment is in its life cycle. */
export type DeflectionAssignmentStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A deflection assignment. Its code is unique within a tenant. */
export class DeflectionAssignment {
  code: string;
  title: string;
  category: string;
  cohort: string;
  startsAt: number;
  floorValue: number;
  status: DeflectionAssignmentStatus;

  constructor(
    code: string,
    title: string,
    category: string,
    cohort: string,
    startsAt: number,
    floorValue: number,
    status: DeflectionAssignmentStatus,
  ) {
    this.code = code;
    this.title = title;
    this.category = category;
    this.cohort = cohort;
    this.startsAt = startsAt;
    this.floorValue = floorValue;
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

  canMoveTo(next: DeflectionAssignmentStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "active";
      case "pending":
        switch (next) {
          case "active":
            return true;
        }
        return false;
      case "active":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: DeflectionAssignmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`deflection assignment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  netValue(): number {
    return Math.round((this.startsAt + this.floorValue) * 100) / 100;
  }

  copy(): DeflectionAssignment {
    return new DeflectionAssignment(
      this.code,
      this.title,
      this.category,
      this.cohort,
      this.startsAt,
      this.floorValue,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a deflection assignment in status draft. */
export function newDeflectionAssignment(code: string, title: string): DeflectionAssignment {
  return new DeflectionAssignment(code, title, "", "", 0, 0, "draft");
}
