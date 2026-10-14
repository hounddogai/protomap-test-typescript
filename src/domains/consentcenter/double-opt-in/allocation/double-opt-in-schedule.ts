import * as text from "../../../../kit/text.js";

/** Where a double opt in schedule is in its life cycle. */
export type DoubleOptInScheduleStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One double opt in schedule, with what the planners need to act on it. */
export class DoubleOptInSchedule {
  code: string;
  label: string;
  ownerId: string;
  title: string;
  ratio: number;
  variant: string;
  graceDays: number;
  status: DoubleOptInScheduleStatus;

  constructor(
    code: string,
    label: string,
    ownerId: string,
    title: string,
    ratio: number,
    variant: string,
    graceDays: number,
    status: DoubleOptInScheduleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.ownerId = ownerId;
    this.title = title;
    this.ratio = ratio;
    this.variant = variant;
    this.graceDays = graceDays;
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

  canMoveTo(next: DoubleOptInScheduleStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "scheduled" || next === "completed";
      case "scheduled":
        switch (next) {
          case "in_progress":
            return true;
        }
        return false;
      case "in_progress":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: DoubleOptInScheduleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`double opt in schedule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"double opt in schedule"} ${this.code}`;
  }

  weightedValue(): number {
    return Math.round((this.ratio - this.graceDays) * 100) / 100;
  }

  copy(): DoubleOptInSchedule {
    return new DoubleOptInSchedule(
      this.code,
      this.label,
      this.ownerId,
      this.title,
      this.ratio,
      this.variant,
      this.graceDays,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a double opt in schedule in status planned. */
export function newDoubleOptInSchedule(code: string, label: string): DoubleOptInSchedule {
  return new DoubleOptInSchedule(code, label, "", "", 0, "", 0, "planned");
}
