import * as text from "../../../../kit/text.js";

/** Where a strict cohort assignment is in its life cycle. */
export type StrictCohortAssignmentStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A strict cohort assignment as the cohort team keeps it. */
export class StrictCohortAssignment {
  code: string;
  name: string;
  phone: string;
  contactEmail: string;
  startsAt: number;
  score: number;
  locale: string;
  retries: number;
  currency: string;
  status: StrictCohortAssignmentStatus;

  constructor(
    code: string,
    name: string,
    phone: string,
    contactEmail: string,
    startsAt: number,
    score: number,
    locale: string,
    retries: number,
    currency: string,
    status: StrictCohortAssignmentStatus,
  ) {
    this.code = code;
    this.name = name;
    this.phone = phone;
    this.contactEmail = contactEmail;
    this.startsAt = startsAt;
    this.score = score;
    this.locale = locale;
    this.retries = retries;
    this.currency = currency;
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

  canMoveTo(next: StrictCohortAssignmentStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "suspended":
          case "closed":
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
        return next === "closed";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: StrictCohortAssignmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict cohort assignment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  adjustedLoad(): number {
    return Math.round((this.startsAt - this.score) * 100) / 100;
  }

  copy(): StrictCohortAssignment {
    return new StrictCohortAssignment(
      this.code,
      this.name,
      this.phone,
      this.contactEmail,
      this.startsAt,
      this.score,
      this.locale,
      this.retries,
      this.currency,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a strict cohort assignment in status draft. */
export function newStrictCohortAssignment(code: string, name: string): StrictCohortAssignment {
  return new StrictCohortAssignment(code, name, "", "", 0, 0, "", 0, "", "draft");
}
