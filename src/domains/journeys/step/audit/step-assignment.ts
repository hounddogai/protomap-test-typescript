import * as text from "../../../../kit/text.js";

/** Where a step assignment is in its life cycle. */
export type StepAssignmentStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A step assignment as the step team keeps it. */
export class StepAssignment {
  code: string;
  title: string;
  notes: string;
  expiresAt: number;
  locale: string;
  retries: number;
  region: string;
  createdAt: number;
  status: StepAssignmentStatus;

  constructor(
    code: string,
    title: string,
    notes: string,
    expiresAt: number,
    locale: string,
    retries: number,
    region: string,
    createdAt: number,
    status: StepAssignmentStatus,
  ) {
    this.code = code;
    this.title = title;
    this.notes = notes;
    this.expiresAt = expiresAt;
    this.locale = locale;
    this.retries = retries;
    this.region = region;
    this.createdAt = createdAt;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: StepAssignmentStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved" || next === "rejected";
      case "approved":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: StepAssignmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`step assignment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  projectedValue(): number {
    return Math.round((this.createdAt - this.expiresAt) * 100) / 100;
  }

  copy(): StepAssignment {
    return new StepAssignment(
      this.code,
      this.title,
      this.notes,
      this.expiresAt,
      this.locale,
      this.retries,
      this.region,
      this.createdAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a step assignment in status proposed. */
export function newStepAssignment(code: string, title: string): StepAssignment {
  return new StepAssignment(code, title, "", 0, "", 0, "", 0, "proposed");
}
