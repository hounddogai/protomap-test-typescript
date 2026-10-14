import * as text from "../../../../kit/text.js";

/** Where a cohort exception is in its life cycle. */
export type CohortExceptionStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A cohort exception as the cohort team keeps it. */
export class CohortException {
  code: string;
  name: string;
  unit: string;
  attempts: number;
  endsAt: number;
  archived: boolean;
  status: CohortExceptionStatus;

  constructor(
    code: string,
    name: string,
    unit: string,
    attempts: number,
    endsAt: number,
    archived: boolean,
    status: CohortExceptionStatus,
  ) {
    this.code = code;
    this.name = name;
    this.unit = unit;
    this.attempts = attempts;
    this.endsAt = endsAt;
    this.archived = archived;
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

  canMoveTo(next: CohortExceptionStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "active":
          case "closed":
            return true;
        }
        return false;
      case "pending":
        return next === "active";
      case "active":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: CohortExceptionStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`cohort exception ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  weightedLoad(): number {
    return Math.round((this.endsAt + this.attempts) * 100) / 100;
  }

  copy(): CohortException {
    return new CohortException(this.code, this.name, this.unit, this.attempts, this.endsAt, this.archived, this.status);
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a cohort exception in status draft. */
export function newCohortException(code: string, name: string): CohortException {
  return new CohortException(code, name, "", 0, 0, false, "draft");
}
