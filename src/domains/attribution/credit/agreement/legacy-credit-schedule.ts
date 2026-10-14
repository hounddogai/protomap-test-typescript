import * as text from "../../../../kit/text.js";

/** Where a legacy credit schedule is in its life cycle. */
export type LegacyCreditScheduleStatus = "created" | "validated" | "published" | "retired";

/** One legacy credit schedule, with what the planners need to act on it. */
export class LegacyCreditSchedule {
  code: string;
  label: string;
  priority: number;
  bid: number;
  amount: number;
  graceDays: number;
  status: LegacyCreditScheduleStatus;

  constructor(
    code: string,
    label: string,
    priority: number,
    bid: number,
    amount: number,
    graceDays: number,
    status: LegacyCreditScheduleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.priority = priority;
    this.bid = bid;
    this.amount = amount;
    this.graceDays = graceDays;
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

  canMoveTo(next: LegacyCreditScheduleStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated" || next === "retired";
      case "validated":
        switch (next) {
          case "published":
            return true;
        }
        return false;
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LegacyCreditScheduleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy credit schedule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  weightedLoad(): number {
    return Math.round((this.priority - this.bid) * 100) / 100;
  }

  copy(): LegacyCreditSchedule {
    return new LegacyCreditSchedule(
      this.code,
      this.label,
      this.priority,
      this.bid,
      this.amount,
      this.graceDays,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a legacy credit schedule in status created. */
export function newLegacyCreditSchedule(code: string, label: string): LegacyCreditSchedule {
  return new LegacyCreditSchedule(code, label, 0, 0, 0, 0, "created");
}
