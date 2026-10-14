/**
 * The rolling wait baseline records of journeys's wait work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a rolling wait baseline is in its life cycle. */
export type RollingWaitBaselineStatus = "created" | "validated" | "published" | "retired";

/** The record of a rolling wait baseline and its current status. */
export class RollingWaitBaseline {
  code: string;
  name: string;
  locale: string;
  minimum: number;
  endsAt: number;
  capacity: number;
  status: RollingWaitBaselineStatus;

  constructor(
    code: string,
    name: string,
    locale: string,
    minimum: number,
    endsAt: number,
    capacity: number,
    status: RollingWaitBaselineStatus,
  ) {
    this.code = code;
    this.name = name;
    this.locale = locale;
    this.minimum = minimum;
    this.endsAt = endsAt;
    this.capacity = capacity;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: RollingWaitBaselineStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated" || next === "published";
      case "validated":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RollingWaitBaselineStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling wait baseline ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  projectedValue(): number {
    return Math.round((this.endsAt - this.minimum) * 100) / 100;
  }

  copy(): RollingWaitBaseline {
    return new RollingWaitBaseline(
      this.code,
      this.name,
      this.locale,
      this.minimum,
      this.endsAt,
      this.capacity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a rolling wait baseline in status created. */
export function newRollingWaitBaseline(code: string, name: string): RollingWaitBaseline {
  return new RollingWaitBaseline(code, name, "", 0, 0, 0, "created");
}
