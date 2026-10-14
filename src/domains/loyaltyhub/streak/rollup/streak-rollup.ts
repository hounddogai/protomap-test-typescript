/**
 * The streak rollup records of loyaltyhub's streak work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a streak rollup is in its life cycle. */
export type StreakRollupStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a streak rollup and its current status. */
export class StreakRollup {
  code: string;
  name: string;
  floorValue: number;
  attempts: number;
  ownerId: string;
  cohort: string;
  status: StreakRollupStatus;

  constructor(
    code: string,
    name: string,
    floorValue: number,
    attempts: number,
    ownerId: string,
    cohort: string,
    status: StreakRollupStatus,
  ) {
    this.code = code;
    this.name = name;
    this.floorValue = floorValue;
    this.attempts = attempts;
    this.ownerId = ownerId;
    this.cohort = cohort;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: StreakRollupStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
            return true;
        }
        return false;
      case "granted":
        switch (next) {
          case "revoked":
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: StreakRollupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`streak rollup ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  projectedVolume(): number {
    return Math.round((this.attempts + this.floorValue) * 100) / 100;
  }

  copy(): StreakRollup {
    return new StreakRollup(
      this.code,
      this.name,
      this.floorValue,
      this.attempts,
      this.ownerId,
      this.cohort,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a streak rollup in status requested. */
export function newStreakRollup(code: string, name: string): StreakRollup {
  return new StreakRollup(code, name, 0, 0, "", "", "requested");
}
