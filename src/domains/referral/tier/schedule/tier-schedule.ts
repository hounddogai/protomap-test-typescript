/**
 * The tier schedule records of referral's tier work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a tier schedule is in its life cycle. */
export type TierScheduleStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A tier schedule as the tier team keeps it. */
export class TierSchedule {
  code: string;
  name: string;
  unit: string;
  summary: string;
  quantity: number;
  status: TierScheduleStatus;

  constructor(
    code: string,
    name: string,
    unit: string,
    summary: string,
    quantity: number,
    status: TierScheduleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.unit = unit;
    this.summary = summary;
    this.quantity = quantity;
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

  canMoveTo(next: TierScheduleStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "warming":
        return next === "ready" || next === "draining";
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

  moveTo(next: TierScheduleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tier schedule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  measuredValue(): number {
    return this.quantity;
  }

  copy(): TierSchedule {
    return new TierSchedule(this.code, this.name, this.unit, this.summary, this.quantity, this.status);
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a tier schedule in status idle. */
export function newTierSchedule(code: string, name: string): TierSchedule {
  return new TierSchedule(code, name, "", "", 0, "idle");
}
