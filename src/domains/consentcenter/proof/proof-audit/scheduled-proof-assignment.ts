import * as text from "../../../../kit/text.js";

/** Where a scheduled proof assignment is in its life cycle. */
export type ScheduledProofAssignmentStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A scheduled proof assignment as the proof team keeps it. */
export class ScheduledProofAssignment {
  code: string;
  name: string;
  source: string;
  externalRef: string;
  rate: number;
  description: string;
  retries: number;
  ceiling: number;
  status: ScheduledProofAssignmentStatus;

  constructor(
    code: string,
    name: string,
    source: string,
    externalRef: string,
    rate: number,
    description: string,
    retries: number,
    ceiling: number,
    status: ScheduledProofAssignmentStatus,
  ) {
    this.code = code;
    this.name = name;
    this.source = source;
    this.externalRef = externalRef;
    this.rate = rate;
    this.description = description;
    this.retries = retries;
    this.ceiling = ceiling;
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

  canMoveTo(next: ScheduledProofAssignmentStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "pending";
      case "pending":
        switch (next) {
          case "active":
          case "closed":
            return true;
        }
        return false;
      case "active":
        return next === "closed";
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ScheduledProofAssignmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled proof assignment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  projectedTotal(): number {
    return Math.round(this.rate * this.retries * 100) / 100;
  }

  copy(): ScheduledProofAssignment {
    return new ScheduledProofAssignment(
      this.code,
      this.name,
      this.source,
      this.externalRef,
      this.rate,
      this.description,
      this.retries,
      this.ceiling,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a scheduled proof assignment in status draft. */
export function newScheduledProofAssignment(code: string, name: string): ScheduledProofAssignment {
  return new ScheduledProofAssignment(code, name, "", "", 0, "", 0, 0, "draft");
}
