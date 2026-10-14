/**
 * The scheduled deflection rollup records of support's deflection work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a scheduled deflection rollup is in its life cycle. */
export type ScheduledDeflectionRollupStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One scheduled deflection rollup, with what the planners need to act on it. */
export class ScheduledDeflectionRollup {
  code: string;
  name: string;
  ownerId: string;
  margin: number;
  durationMinutes: number;
  version: number;
  status: ScheduledDeflectionRollupStatus;

  constructor(
    code: string,
    name: string,
    ownerId: string,
    margin: number,
    durationMinutes: number,
    version: number,
    status: ScheduledDeflectionRollupStatus,
  ) {
    this.code = code;
    this.name = name;
    this.ownerId = ownerId;
    this.margin = margin;
    this.durationMinutes = durationMinutes;
    this.version = version;
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

  canMoveTo(next: ScheduledDeflectionRollupStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        switch (next) {
          case "rejected":
            return true;
        }
        return false;
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ScheduledDeflectionRollupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled deflection rollup ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  projectedExposure(): number {
    return Math.round((this.margin - this.version) * 100) / 100;
  }

  copy(): ScheduledDeflectionRollup {
    return new ScheduledDeflectionRollup(
      this.code,
      this.name,
      this.ownerId,
      this.margin,
      this.durationMinutes,
      this.version,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a scheduled deflection rollup in status proposed. */
export function newScheduledDeflectionRollup(code: string, name: string): ScheduledDeflectionRollup {
  return new ScheduledDeflectionRollup(code, name, "", 0, 0, 0, "proposed");
}
