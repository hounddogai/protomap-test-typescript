import * as text from "../../../../kit/text.js";

/** Where a primary proof assignment is in its life cycle. */
export type PrimaryProofAssignmentStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a primary proof assignment and its current status. */
export class PrimaryProofAssignment {
  code: string;
  title: string;
  graceDays: number;
  externalRef: string;
  unit: string;
  status: PrimaryProofAssignmentStatus;

  constructor(
    code: string,
    title: string,
    graceDays: number,
    externalRef: string,
    unit: string,
    status: PrimaryProofAssignmentStatus,
  ) {
    this.code = code;
    this.title = title;
    this.graceDays = graceDays;
    this.externalRef = externalRef;
    this.unit = unit;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: PrimaryProofAssignmentStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "reopened":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "resolved":
          case "reopened":
            return true;
        }
        return false;
      case "resolved":
        switch (next) {
          case "reopened":
            return true;
        }
        return false;
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PrimaryProofAssignmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary proof assignment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"primary proof assignment"} ${this.code}`;
  }

  measuredValue(): number {
    return this.graceDays;
  }

  copy(): PrimaryProofAssignment {
    return new PrimaryProofAssignment(this.code, this.title, this.graceDays, this.externalRef, this.unit, this.status);
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a primary proof assignment in status open. */
export function newPrimaryProofAssignment(code: string, title: string): PrimaryProofAssignment {
  return new PrimaryProofAssignment(code, title, 0, "", "", "open");
}
