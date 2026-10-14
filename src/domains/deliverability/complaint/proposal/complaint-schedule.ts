import * as text from "../../../../kit/text.js";

/** Where a complaint schedule is in its life cycle. */
export type ComplaintScheduleStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One complaint schedule, with what the planners need to act on it. */
export class ComplaintSchedule {
  code: string;
  label: string;
  active: boolean;
  budget: number;
  pinned: boolean;
  batchSize: number;
  score: number;
  retries: number;
  contactEmail: string;
  windowDays: number;
  minimum: number;
  status: ComplaintScheduleStatus;

  constructor(
    code: string,
    label: string,
    active: boolean,
    budget: number,
    pinned: boolean,
    batchSize: number,
    score: number,
    retries: number,
    contactEmail: string,
    windowDays: number,
    minimum: number,
    status: ComplaintScheduleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.active = active;
    this.budget = budget;
    this.pinned = pinned;
    this.batchSize = batchSize;
    this.score = score;
    this.retries = retries;
    this.contactEmail = contactEmail;
    this.windowDays = windowDays;
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

  canMoveTo(next: ComplaintScheduleStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "resolved":
            return true;
        }
        return false;
      case "in_review":
        return next === "resolved" || next === "archived";
      case "resolved":
        return next === "reopened";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: ComplaintScheduleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`complaint schedule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"complaint schedule"} ${this.code}`;
  }

  netTotal(): number {
    return Math.round((this.budget + this.batchSize) * 100) / 100;
  }

  copy(): ComplaintSchedule {
    return new ComplaintSchedule(
      this.code,
      this.label,
      this.active,
      this.budget,
      this.pinned,
      this.batchSize,
      this.score,
      this.retries,
      this.contactEmail,
      this.windowDays,
      this.minimum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a complaint schedule in status open. */
export function newComplaintSchedule(code: string, label: string): ComplaintSchedule {
  return new ComplaintSchedule(code, label, false, 0, false, 0, 0, 0, "", 0, 0, "open");
}
