/**
 * The rolling csat schedule records of support's csat work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a rolling csat schedule is in its life cycle. */
export type RollingCsatScheduleStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A rolling csat schedule. Its code is unique within a tenant. */
export class RollingCsatSchedule {
  code: string;
  name: string;
  audienceId: string;
  unit: string;
  revision: number;
  maximum: number;
  ownerId: string;
  status: RollingCsatScheduleStatus;

  constructor(
    code: string,
    name: string,
    audienceId: string,
    unit: string,
    revision: number,
    maximum: number,
    ownerId: string,
    status: RollingCsatScheduleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.audienceId = audienceId;
    this.unit = unit;
    this.revision = revision;
    this.maximum = maximum;
    this.ownerId = ownerId;
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

  canMoveTo(next: RollingCsatScheduleStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "scheduled":
          case "in_progress":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "in_progress":
          case "cancelled":
            return true;
        }
        return false;
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

  moveTo(next: RollingCsatScheduleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling csat schedule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  projectedTotal(): number {
    return Math.round(this.revision * this.maximum * 100) / 100;
  }

  copy(): RollingCsatSchedule {
    return new RollingCsatSchedule(
      this.code,
      this.name,
      this.audienceId,
      this.unit,
      this.revision,
      this.maximum,
      this.ownerId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a rolling csat schedule in status planned. */
export function newRollingCsatSchedule(code: string, name: string): RollingCsatSchedule {
  return new RollingCsatSchedule(code, name, "", "", 0, 0, "", "planned");
}
