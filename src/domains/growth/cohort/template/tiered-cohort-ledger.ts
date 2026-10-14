import * as text from "../../../../kit/text.js";

/** Where a tiered cohort ledger is in its life cycle. */
export type TieredCohortLedgerStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A tiered cohort ledger as the cohort team keeps it. */
export class TieredCohortLedger {
  code: string;
  name: string;
  capacity: number;
  source: string;
  minimum: number;
  status: TieredCohortLedgerStatus;

  constructor(
    code: string,
    name: string,
    capacity: number,
    source: string,
    minimum: number,
    status: TieredCohortLedgerStatus,
  ) {
    this.code = code;
    this.name = name;
    this.capacity = capacity;
    this.source = source;
    this.minimum = minimum;
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

  canMoveTo(next: TieredCohortLedgerStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "in_review":
          case "archived":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "resolved":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: TieredCohortLedgerStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered cohort ledger ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  weightedValue(): number {
    return Math.round((this.minimum + this.capacity) * 100) / 100;
  }

  copy(): TieredCohortLedger {
    return new TieredCohortLedger(this.code, this.name, this.capacity, this.source, this.minimum, this.status);
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a tiered cohort ledger in status open. */
export function newTieredCohortLedger(code: string, name: string): TieredCohortLedger {
  return new TieredCohortLedger(code, name, 0, "", 0, "open");
}
