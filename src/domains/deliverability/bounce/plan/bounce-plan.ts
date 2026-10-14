/**
 * The bounce plan records of deliverability's bounce work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a bounce plan is in its life cycle. */
export type BouncePlanStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One bounce plan, with what the planners need to act on it. */
export class BouncePlan {
  code: string;
  name: string;
  cohort: string;
  capacity: number;
  active: boolean;
  frequencyCap: number;
  category: string;
  channel: string;
  timezone: string;
  status: BouncePlanStatus;

  constructor(
    code: string,
    name: string,
    cohort: string,
    capacity: number,
    active: boolean,
    frequencyCap: number,
    category: string,
    channel: string,
    timezone: string,
    status: BouncePlanStatus,
  ) {
    this.code = code;
    this.name = name;
    this.cohort = cohort;
    this.capacity = capacity;
    this.active = active;
    this.frequencyCap = frequencyCap;
    this.category = category;
    this.channel = channel;
    this.timezone = timezone;
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

  canMoveTo(next: BouncePlanStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "warming":
          case "stopped":
            return true;
        }
        return false;
      case "warming":
        return next === "stopped";
      case "ready":
        return next === "draining" || next === "stopped";
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: BouncePlanStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`bounce plan ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  projectedVolume(): number {
    return Math.round((this.frequencyCap - this.capacity) * 100) / 100;
  }

  copy(): BouncePlan {
    return new BouncePlan(
      this.code,
      this.name,
      this.cohort,
      this.capacity,
      this.active,
      this.frequencyCap,
      this.category,
      this.channel,
      this.timezone,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a bounce plan in status idle. */
export function newBouncePlan(code: string, name: string): BouncePlan {
  return new BouncePlan(code, name, "", 0, false, 0, "", "", "", "idle");
}
