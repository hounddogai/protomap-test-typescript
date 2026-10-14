/**
 * The sla schedule records of support's sla work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a sla schedule is in its life cycle. */
export type SlaScheduleStatus = "requested" | "granted" | "revoked" | "expired";

/** One sla schedule, with what the planners need to act on it. */
export class SlaSchedule {
  code: string;
  name: string;
  impressions: number;
  version: number;
  unit: string;
  budget: number;
  minimum: number;
  currency: string;
  priority: number;
  ownerId: string;
  status: SlaScheduleStatus;

  constructor(
    code: string,
    name: string,
    impressions: number,
    version: number,
    unit: string,
    budget: number,
    minimum: number,
    currency: string,
    priority: number,
    ownerId: string,
    status: SlaScheduleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.impressions = impressions;
    this.version = version;
    this.unit = unit;
    this.budget = budget;
    this.minimum = minimum;
    this.currency = currency;
    this.priority = priority;
    this.ownerId = ownerId;
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

  canMoveTo(next: SlaScheduleStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "expired";
      case "granted":
        switch (next) {
          case "revoked":
            return true;
        }
        return false;
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: SlaScheduleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`sla schedule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  weightedTotal(): number {
    return Math.round((this.budget + this.priority) * 100) / 100;
  }

  copy(): SlaSchedule {
    return new SlaSchedule(
      this.code,
      this.name,
      this.impressions,
      this.version,
      this.unit,
      this.budget,
      this.minimum,
      this.currency,
      this.priority,
      this.ownerId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a sla schedule in status requested. */
export function newSlaSchedule(code: string, name: string): SlaSchedule {
  return new SlaSchedule(code, name, 0, 0, "", 0, 0, "", 0, "", "requested");
}
