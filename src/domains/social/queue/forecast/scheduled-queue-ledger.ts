import * as text from "../../../../kit/text.js";

/** Where a scheduled queue ledger is in its life cycle. */
export type ScheduledQueueLedgerStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One scheduled queue ledger, with what the planners need to act on it. */
export class ScheduledQueueLedger {
  code: string;
  name: string;
  reviewer: string;
  notes: string;
  threshold: number;
  status: ScheduledQueueLedgerStatus;

  constructor(
    code: string,
    name: string,
    reviewer: string,
    notes: string,
    threshold: number,
    status: ScheduledQueueLedgerStatus,
  ) {
    this.code = code;
    this.name = name;
    this.reviewer = reviewer;
    this.notes = notes;
    this.threshold = threshold;
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

  canMoveTo(next: ScheduledQueueLedgerStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "resolved";
      case "in_review":
        return next === "resolved" || next === "archived";
      case "resolved":
        return next === "reopened" || next === "archived";
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ScheduledQueueLedgerStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled queue ledger ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  measuredValue(): number {
    return this.threshold;
  }

  copy(): ScheduledQueueLedger {
    return new ScheduledQueueLedger(this.code, this.name, this.reviewer, this.notes, this.threshold, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a scheduled queue ledger in status open. */
export function newScheduledQueueLedger(code: string, name: string): ScheduledQueueLedger {
  return new ScheduledQueueLedger(code, name, "", "", 0, "open");
}
