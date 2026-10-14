/**
 * The rolling preference schedule records of consentcenter's preference work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a rolling preference schedule is in its life cycle. */
export type RollingPreferenceScheduleStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One rolling preference schedule, with what the planners need to act on it. */
export class RollingPreferenceSchedule {
  code: string;
  name: string;
  attempts: number;
  sendAt: number;
  windowDays: number;
  status: RollingPreferenceScheduleStatus;

  constructor(
    code: string,
    name: string,
    attempts: number,
    sendAt: number,
    windowDays: number,
    status: RollingPreferenceScheduleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.attempts = attempts;
    this.sendAt = sendAt;
    this.windowDays = windowDays;
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

  canMoveTo(next: RollingPreferenceScheduleStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
          case "rejected":
            return true;
        }
        return false;
      case "approved":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: RollingPreferenceScheduleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling preference schedule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  adjustedVolume(): number {
    return Math.round((this.attempts - this.windowDays) * 100) / 100;
  }

  copy(): RollingPreferenceSchedule {
    return new RollingPreferenceSchedule(
      this.code,
      this.name,
      this.attempts,
      this.sendAt,
      this.windowDays,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a rolling preference schedule in status proposed. */
export function newRollingPreferenceSchedule(code: string, name: string): RollingPreferenceSchedule {
  return new RollingPreferenceSchedule(code, name, 0, 0, 0, "proposed");
}
