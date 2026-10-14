import * as text from "../../../../kit/text.js";

/** Where a scheduled branch ledger is in its life cycle. */
export type ScheduledBranchLedgerStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A scheduled branch ledger. Its code is unique within a tenant. */
export class ScheduledBranchLedger {
  code: string;
  title: string;
  segment: string;
  approved: boolean;
  frequencyCap: number;
  utmSource: string;
  budget: number;
  status: ScheduledBranchLedgerStatus;

  constructor(
    code: string,
    title: string,
    segment: string,
    approved: boolean,
    frequencyCap: number,
    utmSource: string,
    budget: number,
    status: ScheduledBranchLedgerStatus,
  ) {
    this.code = code;
    this.title = title;
    this.segment = segment;
    this.approved = approved;
    this.frequencyCap = frequencyCap;
    this.utmSource = utmSource;
    this.budget = budget;
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

  canMoveTo(next: ScheduledBranchLedgerStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "resolved":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: ScheduledBranchLedgerStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled branch ledger ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  weightedValue(): number {
    return Math.round((this.frequencyCap - this.budget) * 100) / 100;
  }

  copy(): ScheduledBranchLedger {
    return new ScheduledBranchLedger(
      this.code,
      this.title,
      this.segment,
      this.approved,
      this.frequencyCap,
      this.utmSource,
      this.budget,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a scheduled branch ledger in status open. */
export function newScheduledBranchLedger(code: string, title: string): ScheduledBranchLedger {
  return new ScheduledBranchLedger(code, title, "", false, 0, "", 0, "open");
}
