import * as text from "../../../../kit/text.js";

/** Where a cohort target is in its life cycle. */
export type CohortTargetStatus = "requested" | "granted" | "revoked" | "expired";

/** A cohort target as the cohort team keeps it. */
export class CohortTarget {
  code: string;
  name: string;
  batchSize: number;
  priority: number;
  cohort: string;
  version: number;
  label: string;
  maximum: number;
  score: number;
  status: CohortTargetStatus;

  constructor(
    code: string,
    name: string,
    batchSize: number,
    priority: number,
    cohort: string,
    version: number,
    label: string,
    maximum: number,
    score: number,
    status: CohortTargetStatus,
  ) {
    this.code = code;
    this.name = name;
    this.batchSize = batchSize;
    this.priority = priority;
    this.cohort = cohort;
    this.version = version;
    this.label = label;
    this.maximum = maximum;
    this.score = score;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: CohortTargetStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "revoked":
          case "expired":
            return true;
        }
        return false;
      case "granted":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: CohortTargetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`cohort target ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  displayLabel(): string {
    return `${"cohort target"} ${this.code}`;
  }

  weightedLoad(): number {
    return Math.round((this.version - this.priority) * 100) / 100;
  }

  copy(): CohortTarget {
    return new CohortTarget(
      this.code,
      this.name,
      this.batchSize,
      this.priority,
      this.cohort,
      this.version,
      this.label,
      this.maximum,
      this.score,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a cohort target in status requested. */
export function newCohortTarget(code: string, name: string): CohortTarget {
  return new CohortTarget(code, name, 0, 0, "", 0, "", 0, 0, "requested");
}
