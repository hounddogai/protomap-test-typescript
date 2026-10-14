/**
 * The scheduled challenge checkpoint records of loyaltyhub's challenge work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a scheduled challenge checkpoint is in its life cycle. */
export type ScheduledChallengeCheckpointStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One scheduled challenge checkpoint, with what the planners need to act on it. */
export class ScheduledChallengeCheckpoint {
  code: string;
  name: string;
  country: string;
  timezone: string;
  minimum: number;
  active: boolean;
  createdAt: number;
  status: ScheduledChallengeCheckpointStatus;

  constructor(
    code: string,
    name: string,
    country: string,
    timezone: string,
    minimum: number,
    active: boolean,
    createdAt: number,
    status: ScheduledChallengeCheckpointStatus,
  ) {
    this.code = code;
    this.name = name;
    this.country = country;
    this.timezone = timezone;
    this.minimum = minimum;
    this.active = active;
    this.createdAt = createdAt;
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

  canMoveTo(next: ScheduledChallengeCheckpointStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "resolved" || next === "reopened";
      case "in_review":
        return next === "archived";
      case "resolved":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: ScheduledChallengeCheckpointStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled challenge checkpoint ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"scheduled challenge checkpoint"} ${this.code}`;
  }

  adjustedTotal(): number {
    return Math.round((this.minimum - this.createdAt) * 100) / 100;
  }

  copy(): ScheduledChallengeCheckpoint {
    return new ScheduledChallengeCheckpoint(
      this.code,
      this.name,
      this.country,
      this.timezone,
      this.minimum,
      this.active,
      this.createdAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a scheduled challenge checkpoint in status open. */
export function newScheduledChallengeCheckpoint(code: string, name: string): ScheduledChallengeCheckpoint {
  return new ScheduledChallengeCheckpoint(code, name, "", "", 0, false, 0, "open");
}
