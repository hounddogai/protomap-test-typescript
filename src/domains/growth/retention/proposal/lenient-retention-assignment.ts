import * as text from "../../../../kit/text.js";

/** Where a lenient retention assignment is in its life cycle. */
export type LenientRetentionAssignmentStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a lenient retention assignment and its current status. */
export class LenientRetentionAssignment {
  code: string;
  name: string;
  limit: number;
  utmSource: string;
  maximum: number;
  status: LenientRetentionAssignmentStatus;

  constructor(
    code: string,
    name: string,
    limit: number,
    utmSource: string,
    maximum: number,
    status: LenientRetentionAssignmentStatus,
  ) {
    this.code = code;
    this.name = name;
    this.limit = limit;
    this.utmSource = utmSource;
    this.maximum = maximum;
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

  canMoveTo(next: LenientRetentionAssignmentStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "closed";
      case "pending":
        return next === "suspended" || next === "closed";
      case "active":
        return next === "suspended";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: LenientRetentionAssignmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient retention assignment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  effectiveLoad(): number {
    return Math.round((this.limit - this.maximum) * 100) / 100;
  }

  copy(): LenientRetentionAssignment {
    return new LenientRetentionAssignment(this.code, this.name, this.limit, this.utmSource, this.maximum, this.status);
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a lenient retention assignment in status draft. */
export function newLenientRetentionAssignment(code: string, name: string): LenientRetentionAssignment {
  return new LenientRetentionAssignment(code, name, 0, "", 0, "draft");
}
