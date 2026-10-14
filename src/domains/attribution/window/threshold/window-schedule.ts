import * as text from "../../../../kit/text.js";

/** Where a window schedule is in its life cycle. */
export type WindowScheduleStatus = "created" | "validated" | "published" | "retired";

/** A window schedule. Its code is unique within a tenant. */
export class WindowSchedule {
  code: string;
  label: string;
  margin: number;
  graceDays: number;
  bid: number;
  status: WindowScheduleStatus;

  constructor(
    code: string,
    label: string,
    margin: number,
    graceDays: number,
    bid: number,
    status: WindowScheduleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.margin = margin;
    this.graceDays = graceDays;
    this.bid = bid;
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

  canMoveTo(next: WindowScheduleStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "retired";
      case "validated":
        return next === "published";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: WindowScheduleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`window schedule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"window schedule"} ${this.code}`;
  }

  adjustedTotal(): number {
    return Math.round(this.bid * this.margin * 100) / 100;
  }

  copy(): WindowSchedule {
    return new WindowSchedule(this.code, this.label, this.margin, this.graceDays, this.bid, this.status);
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a window schedule in status created. */
export function newWindowSchedule(code: string, label: string): WindowSchedule {
  return new WindowSchedule(code, label, 0, 0, 0, "created");
}
