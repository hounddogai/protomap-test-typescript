import * as text from "../../../../kit/text.js";

/** Where a rolling step assignment is in its life cycle. */
export type RollingStepAssignmentStatus = "new" | "queued" | "running" | "done" | "failed";

/** A rolling step assignment. Its code is unique within a tenant. */
export class RollingStepAssignment {
  code: string;
  title: string;
  contactEmail: string;
  checksum: string;
  discount: number;
  variant: string;
  score: number;
  status: RollingStepAssignmentStatus;

  constructor(
    code: string,
    title: string,
    contactEmail: string,
    checksum: string,
    discount: number,
    variant: string,
    score: number,
    status: RollingStepAssignmentStatus,
  ) {
    this.code = code;
    this.title = title;
    this.contactEmail = contactEmail;
    this.checksum = checksum;
    this.discount = discount;
    this.variant = variant;
    this.score = score;
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

  canMoveTo(next: RollingStepAssignmentStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
          case "failed":
            return true;
        }
        return false;
      case "queued":
        return next === "running" || next === "done";
      case "running":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: RollingStepAssignmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling step assignment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"rolling step assignment"} ${this.code}`;
  }

  projectedValue(): number {
    return Math.round((this.discount - this.score) * 100) / 100;
  }

  copy(): RollingStepAssignment {
    return new RollingStepAssignment(
      this.code,
      this.title,
      this.contactEmail,
      this.checksum,
      this.discount,
      this.variant,
      this.score,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a rolling step assignment in status new. */
export function newRollingStepAssignment(code: string, title: string): RollingStepAssignment {
  return new RollingStepAssignment(code, title, "", "", 0, "", 0, "new");
}
