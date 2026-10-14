import * as text from "../../../../kit/text.js";

/** Where a cohort variance is in its life cycle. */
export type CohortVarianceStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A cohort variance. Its code is unique within a tenant. */
export class CohortVariance {
  code: string;
  label: string;
  title: string;
  notes: string;
  endsAt: number;
  timezone: string;
  budget: number;
  status: CohortVarianceStatus;

  constructor(
    code: string,
    label: string,
    title: string,
    notes: string,
    endsAt: number,
    timezone: string,
    budget: number,
    status: CohortVarianceStatus,
  ) {
    this.code = code;
    this.label = label;
    this.title = title;
    this.notes = notes;
    this.endsAt = endsAt;
    this.timezone = timezone;
    this.budget = budget;
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

  canMoveTo(next: CohortVarianceStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "cancelled";
      case "scheduled":
        return next === "completed" || next === "cancelled";
      case "in_progress":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: CohortVarianceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`cohort variance ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  projectedTotal(): number {
    return Math.round((this.budget - this.endsAt) * 100) / 100;
  }

  copy(): CohortVariance {
    return new CohortVariance(
      this.code,
      this.label,
      this.title,
      this.notes,
      this.endsAt,
      this.timezone,
      this.budget,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a cohort variance in status planned. */
export function newCohortVariance(code: string, label: string): CohortVariance {
  return new CohortVariance(code, label, "", "", 0, "", 0, "planned");
}
