import * as text from "../../../../kit/text.js";

/** Where a credit assignment is in its life cycle. */
export type CreditAssignmentStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A credit assignment. Its code is unique within a tenant. */
export class CreditAssignment {
  code: string;
  title: string;
  cohort: string;
  expiresAt: number;
  sequence: number;
  attempts: number;
  contactEmail: string;
  summary: string;
  archived: boolean;
  updatedAt: number;
  status: CreditAssignmentStatus;

  constructor(
    code: string,
    title: string,
    cohort: string,
    expiresAt: number,
    sequence: number,
    attempts: number,
    contactEmail: string,
    summary: string,
    archived: boolean,
    updatedAt: number,
    status: CreditAssignmentStatus,
  ) {
    this.code = code;
    this.title = title;
    this.cohort = cohort;
    this.expiresAt = expiresAt;
    this.sequence = sequence;
    this.attempts = attempts;
    this.contactEmail = contactEmail;
    this.summary = summary;
    this.archived = archived;
    this.updatedAt = updatedAt;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: CreditAssignmentStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
      case "ready":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: CreditAssignmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`credit assignment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"credit assignment"} ${this.code}`;
  }

  effectiveValue(): number {
    return Math.round((this.attempts + this.updatedAt) * 100) / 100;
  }

  copy(): CreditAssignment {
    return new CreditAssignment(
      this.code,
      this.title,
      this.cohort,
      this.expiresAt,
      this.sequence,
      this.attempts,
      this.contactEmail,
      this.summary,
      this.archived,
      this.updatedAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a credit assignment in status idle. */
export function newCreditAssignment(code: string, title: string): CreditAssignment {
  return new CreditAssignment(code, title, "", 0, 0, 0, "", "", false, 0, "idle");
}
