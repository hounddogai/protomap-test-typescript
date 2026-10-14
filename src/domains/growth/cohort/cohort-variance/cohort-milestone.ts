import * as text from "../../../../kit/text.js";

/** Where a cohort milestone is in its life cycle. */
export type CohortMilestoneStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A cohort milestone. Its code is unique within a tenant. */
export class CohortMilestone {
  code: string;
  name: string;
  locale: string;
  openRate: number;
  retries: number;
  unit: string;
  revision: number;
  segment: string;
  status: CohortMilestoneStatus;

  constructor(
    code: string,
    name: string,
    locale: string,
    openRate: number,
    retries: number,
    unit: string,
    revision: number,
    segment: string,
    status: CohortMilestoneStatus,
  ) {
    this.code = code;
    this.name = name;
    this.locale = locale;
    this.openRate = openRate;
    this.retries = retries;
    this.unit = unit;
    this.revision = revision;
    this.segment = segment;
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

  canMoveTo(next: CohortMilestoneStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "pending" || next === "active";
      case "pending":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
      case "active":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: CohortMilestoneStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`cohort milestone ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  adjustedExposure(): number {
    return Math.round((this.openRate + this.revision) * 100) / 100;
  }

  copy(): CohortMilestone {
    return new CohortMilestone(
      this.code,
      this.name,
      this.locale,
      this.openRate,
      this.retries,
      this.unit,
      this.revision,
      this.segment,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a cohort milestone in status draft. */
export function newCohortMilestone(code: string, name: string): CohortMilestone {
  return new CohortMilestone(code, name, "", 0, 0, "", 0, "", "draft");
}
