import * as text from "../../../../kit/text.js";

/** Where a capped sla schedule is in its life cycle. */
export type CappedSlaScheduleStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One capped sla schedule, with what the planners need to act on it. */
export class CappedSlaSchedule {
  code: string;
  name: string;
  archived: boolean;
  currency: string;
  approved: boolean;
  score: number;
  status: CappedSlaScheduleStatus;

  constructor(
    code: string,
    name: string,
    archived: boolean,
    currency: string,
    approved: boolean,
    score: number,
    status: CappedSlaScheduleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.archived = archived;
    this.currency = currency;
    this.approved = approved;
    this.score = score;
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

  canMoveTo(next: CappedSlaScheduleStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "resolved" || next === "archived";
      case "in_review":
        return next === "reopened" || next === "archived";
      case "resolved":
        switch (next) {
          case "reopened":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: CappedSlaScheduleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped sla schedule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  measuredValue(): number {
    return this.score;
  }

  copy(): CappedSlaSchedule {
    return new CappedSlaSchedule(
      this.code,
      this.name,
      this.archived,
      this.currency,
      this.approved,
      this.score,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a capped sla schedule in status open. */
export function newCappedSlaSchedule(code: string, name: string): CappedSlaSchedule {
  return new CappedSlaSchedule(code, name, false, "", false, 0, "open");
}
