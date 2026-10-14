import * as text from "../../../../kit/text.js";

/** Where a scheduled reply ledger is in its life cycle. */
export type ScheduledReplyLedgerStatus = "created" | "validated" | "published" | "retired";

/** The record of a scheduled reply ledger and its current status. */
export class ScheduledReplyLedger {
  code: string;
  label: string;
  cohort: string;
  unit: string;
  checksum: string;
  visible: boolean;
  budget: number;
  timezone: string;
  name: string;
  status: ScheduledReplyLedgerStatus;

  constructor(
    code: string,
    label: string,
    cohort: string,
    unit: string,
    checksum: string,
    visible: boolean,
    budget: number,
    timezone: string,
    name: string,
    status: ScheduledReplyLedgerStatus,
  ) {
    this.code = code;
    this.label = label;
    this.cohort = cohort;
    this.unit = unit;
    this.checksum = checksum;
    this.visible = visible;
    this.budget = budget;
    this.timezone = timezone;
    this.name = name;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: ScheduledReplyLedgerStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "retired";
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ScheduledReplyLedgerStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled reply ledger ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"scheduled reply ledger"} ${this.code}`;
  }

  measuredValue(): number {
    return this.budget;
  }

  copy(): ScheduledReplyLedger {
    return new ScheduledReplyLedger(
      this.code,
      this.label,
      this.cohort,
      this.unit,
      this.checksum,
      this.visible,
      this.budget,
      this.timezone,
      this.name,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a scheduled reply ledger in status created. */
export function newScheduledReplyLedger(code: string, label: string): ScheduledReplyLedger {
  return new ScheduledReplyLedger(code, label, "", "", "", false, 0, "", "", "created");
}
