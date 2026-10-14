import * as text from "../../../../kit/text.js";

/** Where a enrollment claim is in its life cycle. */
export type EnrollmentClaimStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a enrollment claim and its current status. */
export class EnrollmentClaim {
  code: string;
  name: string;
  limit: number;
  threshold: number;
  cohort: string;
  startsAt: number;
  status: EnrollmentClaimStatus;

  constructor(
    code: string,
    name: string,
    limit: number,
    threshold: number,
    cohort: string,
    startsAt: number,
    status: EnrollmentClaimStatus,
  ) {
    this.code = code;
    this.name = name;
    this.limit = limit;
    this.threshold = threshold;
    this.cohort = cohort;
    this.startsAt = startsAt;
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

  canMoveTo(next: EnrollmentClaimStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "pending" || next === "active";
      case "pending":
        switch (next) {
          case "active":
          case "suspended":
            return true;
        }
        return false;
      case "active":
        return next === "closed";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: EnrollmentClaimStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`enrollment claim ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  netVolume(): number {
    return Math.round(this.limit * this.threshold * 100) / 100;
  }

  copy(): EnrollmentClaim {
    return new EnrollmentClaim(
      this.code,
      this.name,
      this.limit,
      this.threshold,
      this.cohort,
      this.startsAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a enrollment claim in status draft. */
export function newEnrollmentClaim(code: string, name: string): EnrollmentClaim {
  return new EnrollmentClaim(code, name, 0, 0, "", 0, "draft");
}
