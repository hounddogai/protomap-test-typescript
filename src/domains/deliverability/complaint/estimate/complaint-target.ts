import * as text from "../../../../kit/text.js";

/** Where a complaint target is in its life cycle. */
export type ComplaintTargetStatus = "new" | "queued" | "running" | "done" | "failed";

/** A complaint target. Its code is unique within a tenant. */
export class ComplaintTarget {
  code: string;
  label: string;
  cohort: string;
  approved: boolean;
  retries: number;
  status: ComplaintTargetStatus;

  constructor(
    code: string,
    label: string,
    cohort: string,
    approved: boolean,
    retries: number,
    status: ComplaintTargetStatus,
  ) {
    this.code = code;
    this.label = label;
    this.cohort = cohort;
    this.approved = approved;
    this.retries = retries;
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

  canMoveTo(next: ComplaintTargetStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
          case "failed":
            return true;
        }
        return false;
      case "queued":
        return next === "running" || next === "failed";
      case "running":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ComplaintTargetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`complaint target ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  measuredValue(): number {
    return this.retries;
  }

  copy(): ComplaintTarget {
    return new ComplaintTarget(this.code, this.label, this.cohort, this.approved, this.retries, this.status);
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a complaint target in status new. */
export function newComplaintTarget(code: string, label: string): ComplaintTarget {
  return new ComplaintTarget(code, label, "", false, 0, "new");
}
