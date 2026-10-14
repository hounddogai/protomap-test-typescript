import * as text from "../../../../kit/text.js";

/** Where a fallback wait schedule is in its life cycle. */
export type FallbackWaitScheduleStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A fallback wait schedule as the wait team keeps it. */
export class FallbackWaitSchedule {
  code: string;
  name: string;
  version: number;
  channel: string;
  notes: string;
  status: FallbackWaitScheduleStatus;

  constructor(
    code: string,
    name: string,
    version: number,
    channel: string,
    notes: string,
    status: FallbackWaitScheduleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.version = version;
    this.channel = channel;
    this.notes = notes;
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

  canMoveTo(next: FallbackWaitScheduleStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "scheduled":
          case "in_progress":
            return true;
        }
        return false;
      case "scheduled":
        return next === "in_progress" || next === "completed";
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: FallbackWaitScheduleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback wait schedule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${"fallback wait schedule"} ${this.code}`;
  }

  measuredValue(): number {
    return this.version;
  }

  copy(): FallbackWaitSchedule {
    return new FallbackWaitSchedule(this.code, this.name, this.version, this.channel, this.notes, this.status);
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a fallback wait schedule in status planned. */
export function newFallbackWaitSchedule(code: string, name: string): FallbackWaitSchedule {
  return new FallbackWaitSchedule(code, name, 0, "", "", "planned");
}
