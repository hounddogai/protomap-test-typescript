import * as text from "../../../../kit/text.js";

/** Where a capped csat schedule is in its life cycle. */
export type CappedCsatScheduleStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A capped csat schedule. Its code is unique within a tenant. */
export class CappedCsatSchedule {
  code: string;
  title: string;
  attempts: number;
  priority: number;
  startsAt: number;
  clicks: number;
  weight: number;
  amount: number;
  checksum: string;
  externalRef: string;
  status: CappedCsatScheduleStatus;

  constructor(
    code: string,
    title: string,
    attempts: number,
    priority: number,
    startsAt: number,
    clicks: number,
    weight: number,
    amount: number,
    checksum: string,
    externalRef: string,
    status: CappedCsatScheduleStatus,
  ) {
    this.code = code;
    this.title = title;
    this.attempts = attempts;
    this.priority = priority;
    this.startsAt = startsAt;
    this.clicks = clicks;
    this.weight = weight;
    this.amount = amount;
    this.checksum = checksum;
    this.externalRef = externalRef;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: CappedCsatScheduleStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "in_progress":
          case "completed":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "in_progress":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: CappedCsatScheduleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped csat schedule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  effectiveExposure(): number {
    return Math.round((this.clicks + this.weight) * 100) / 100;
  }

  copy(): CappedCsatSchedule {
    return new CappedCsatSchedule(
      this.code,
      this.title,
      this.attempts,
      this.priority,
      this.startsAt,
      this.clicks,
      this.weight,
      this.amount,
      this.checksum,
      this.externalRef,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a capped csat schedule in status planned. */
export function newCappedCsatSchedule(code: string, title: string): CappedCsatSchedule {
  return new CappedCsatSchedule(code, title, 0, 0, 0, 0, 0, 0, "", "", "planned");
}
