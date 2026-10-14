import * as text from "../../../../kit/text.js";

/** Where a cohort summary is in its life cycle. */
export type CohortSummaryStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A cohort summary as the cohort team keeps it. */
export class CohortSummary {
  code: string;
  label: string;
  unit: string;
  budget: number;
  name: string;
  status: CohortSummaryStatus;

  constructor(
    code: string,
    label: string,
    unit: string,
    budget: number,
    name: string,
    status: CohortSummaryStatus,
  ) {
    this.code = code;
    this.label = label;
    this.unit = unit;
    this.budget = budget;
    this.name = name;
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

  canMoveTo(next: CohortSummaryStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "active":
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
        return next === "suspended";
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: CohortSummaryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`cohort summary ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"cohort summary"} ${this.code}`;
  }

  measuredValue(): number {
    return this.budget;
  }

  copy(): CohortSummary {
    return new CohortSummary(this.code, this.label, this.unit, this.budget, this.name, this.status);
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a cohort summary in status draft. */
export function newCohortSummary(code: string, label: string): CohortSummary {
  return new CohortSummary(code, label, "", 0, "", "draft");
}
