/**
 * The rolling preference cycle records of consentcenter's preference work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a rolling preference cycle is in its life cycle. */
export type RollingPreferenceCycleStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a rolling preference cycle and its current status. */
export class RollingPreferenceCycle {
  code: string;
  name: string;
  minimum: number;
  expiresAt: number;
  capacity: number;
  segment: string;
  sequence: number;
  status: RollingPreferenceCycleStatus;

  constructor(
    code: string,
    name: string,
    minimum: number,
    expiresAt: number,
    capacity: number,
    segment: string,
    sequence: number,
    status: RollingPreferenceCycleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.minimum = minimum;
    this.expiresAt = expiresAt;
    this.capacity = capacity;
    this.segment = segment;
    this.sequence = sequence;
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

  canMoveTo(next: RollingPreferenceCycleStatus): boolean {
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
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: RollingPreferenceCycleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling preference cycle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  adjustedTotal(): number {
    return Math.round((this.sequence + this.minimum) * 100) / 100;
  }

  copy(): RollingPreferenceCycle {
    return new RollingPreferenceCycle(
      this.code,
      this.name,
      this.minimum,
      this.expiresAt,
      this.capacity,
      this.segment,
      this.sequence,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a rolling preference cycle in status proposed. */
export function newRollingPreferenceCycle(code: string, name: string): RollingPreferenceCycle {
  return new RollingPreferenceCycle(code, name, 0, 0, 0, "", 0, "proposed");
}
