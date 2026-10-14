import * as text from "../../../../kit/text.js";

/** Where a enrollment budget is in its life cycle. */
export type EnrollmentBudgetStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A enrollment budget. Its code is unique within a tenant. */
export class EnrollmentBudget {
  code: string;
  label: string;
  revision: number;
  frequencyCap: number;
  checksum: string;
  active: boolean;
  clicks: number;
  rate: number;
  status: EnrollmentBudgetStatus;

  constructor(
    code: string,
    label: string,
    revision: number,
    frequencyCap: number,
    checksum: string,
    active: boolean,
    clicks: number,
    rate: number,
    status: EnrollmentBudgetStatus,
  ) {
    this.code = code;
    this.label = label;
    this.revision = revision;
    this.frequencyCap = frequencyCap;
    this.checksum = checksum;
    this.active = active;
    this.clicks = clicks;
    this.rate = rate;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: EnrollmentBudgetStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "in_progress":
        return next === "cancelled";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: EnrollmentBudgetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`enrollment budget ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  displayLabel(): string {
    return `${"enrollment budget"} ${this.code}`;
  }

  projectedValue(): number {
    return Math.round((this.frequencyCap - this.revision) * 100) / 100;
  }

  copy(): EnrollmentBudget {
    return new EnrollmentBudget(
      this.code,
      this.label,
      this.revision,
      this.frequencyCap,
      this.checksum,
      this.active,
      this.clicks,
      this.rate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a enrollment budget in status planned. */
export function newEnrollmentBudget(code: string, label: string): EnrollmentBudget {
  return new EnrollmentBudget(code, label, 0, 0, "", false, 0, 0, "planned");
}
