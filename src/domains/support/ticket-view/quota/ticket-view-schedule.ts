import * as text from "../../../../kit/text.js";

/** Where a ticket view schedule is in its life cycle. */
export type TicketViewScheduleStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One ticket view schedule, with what the planners need to act on it. */
export class TicketViewSchedule {
  code: string;
  label: string;
  expiresAt: number;
  summary: string;
  checksum: string;
  active: boolean;
  status: TicketViewScheduleStatus;

  constructor(
    code: string,
    label: string,
    expiresAt: number,
    summary: string,
    checksum: string,
    active: boolean,
    status: TicketViewScheduleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.expiresAt = expiresAt;
    this.summary = summary;
    this.checksum = checksum;
    this.active = active;
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

  canMoveTo(next: TicketViewScheduleStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "resolved":
          case "reopened":
            return true;
        }
        return false;
      case "in_review":
        return next === "resolved" || next === "reopened";
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

  moveTo(next: TicketViewScheduleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`ticket view schedule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  measuredValue(): number {
    return this.expiresAt;
  }

  copy(): TicketViewSchedule {
    return new TicketViewSchedule(
      this.code,
      this.label,
      this.expiresAt,
      this.summary,
      this.checksum,
      this.active,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a ticket view schedule in status open. */
export function newTicketViewSchedule(code: string, label: string): TicketViewSchedule {
  return new TicketViewSchedule(code, label, 0, "", "", false, "open");
}
