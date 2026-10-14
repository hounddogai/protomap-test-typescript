import * as text from "../../../../kit/text.js";

/** Where a pending escalation schedule is in its life cycle. */
export type PendingEscalationScheduleStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A pending escalation schedule as the escalation team keeps it. */
export class PendingEscalationSchedule {
  code: string;
  name: string;
  threshold: number;
  description: string;
  createdAt: number;
  startsAt: number;
  notes: string;
  status: PendingEscalationScheduleStatus;

  constructor(
    code: string,
    name: string,
    threshold: number,
    description: string,
    createdAt: number,
    startsAt: number,
    notes: string,
    status: PendingEscalationScheduleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.threshold = threshold;
    this.description = description;
    this.createdAt = createdAt;
    this.startsAt = startsAt;
    this.notes = notes;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: PendingEscalationScheduleStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved" || next === "withdrawn";
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: PendingEscalationScheduleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending escalation schedule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  effectiveTotal(): number {
    return Math.round((this.startsAt + this.threshold) * 100) / 100;
  }

  copy(): PendingEscalationSchedule {
    return new PendingEscalationSchedule(
      this.code,
      this.name,
      this.threshold,
      this.description,
      this.createdAt,
      this.startsAt,
      this.notes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a pending escalation schedule in status proposed. */
export function newPendingEscalationSchedule(code: string, name: string): PendingEscalationSchedule {
  return new PendingEscalationSchedule(code, name, 0, "", 0, 0, "", "proposed");
}
