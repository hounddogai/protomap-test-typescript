import * as text from "../../../../kit/text.js";

/** Where a rolling touchpoint target is in its life cycle. */
export type RollingTouchpointTargetStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A rolling touchpoint target. Its code is unique within a tenant. */
export class RollingTouchpointTarget {
  code: string;
  name: string;
  limit: number;
  version: number;
  cohort: string;
  status: RollingTouchpointTargetStatus;

  constructor(
    code: string,
    name: string,
    limit: number,
    version: number,
    cohort: string,
    status: RollingTouchpointTargetStatus,
  ) {
    this.code = code;
    this.name = name;
    this.limit = limit;
    this.version = version;
    this.cohort = cohort;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: RollingTouchpointTargetStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "ready":
          case "stopped":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "ready":
          case "stopped":
            return true;
        }
        return false;
      case "ready":
        return next === "draining";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RollingTouchpointTargetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling touchpoint target ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  projectedExposure(): number {
    return Math.round((this.limit + this.version) * 100) / 100;
  }

  copy(): RollingTouchpointTarget {
    return new RollingTouchpointTarget(this.code, this.name, this.limit, this.version, this.cohort, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a rolling touchpoint target in status idle. */
export function newRollingTouchpointTarget(code: string, name: string): RollingTouchpointTarget {
  return new RollingTouchpointTarget(code, name, 0, 0, "", "idle");
}
