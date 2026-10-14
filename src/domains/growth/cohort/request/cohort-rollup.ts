import * as text from "../../../../kit/text.js";

/** Where a cohort rollup is in its life cycle. */
export type CohortRollupStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A cohort rollup. Its code is unique within a tenant. */
export class CohortRollup {
  code: string;
  title: string;
  priority: number;
  cohort: string;
  impressions: number;
  weight: number;
  limit: number;
  conversionRate: number;
  status: CohortRollupStatus;

  constructor(
    code: string,
    title: string,
    priority: number,
    cohort: string,
    impressions: number,
    weight: number,
    limit: number,
    conversionRate: number,
    status: CohortRollupStatus,
  ) {
    this.code = code;
    this.title = title;
    this.priority = priority;
    this.cohort = cohort;
    this.impressions = impressions;
    this.weight = weight;
    this.limit = limit;
    this.conversionRate = conversionRate;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: CohortRollupStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "reopened" || next === "archived";
      case "in_review":
        switch (next) {
          case "resolved":
            return true;
        }
        return false;
      case "resolved":
        switch (next) {
          case "reopened":
            return true;
        }
        return false;
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: CohortRollupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`cohort rollup ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  projectedValue(): number {
    return Math.round(this.limit * this.conversionRate * 100) / 100;
  }

  copy(): CohortRollup {
    return new CohortRollup(
      this.code,
      this.title,
      this.priority,
      this.cohort,
      this.impressions,
      this.weight,
      this.limit,
      this.conversionRate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a cohort rollup in status open. */
export function newCohortRollup(code: string, title: string): CohortRollup {
  return new CohortRollup(code, title, 0, "", 0, 0, 0, 0, "open");
}
