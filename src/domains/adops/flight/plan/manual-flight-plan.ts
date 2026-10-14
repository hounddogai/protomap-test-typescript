/**
 * The manual flight plan records of adops's flight work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a manual flight plan is in its life cycle. */
export type ManualFlightPlanStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A manual flight plan as the flight team keeps it. */
export class ManualFlightPlan {
  code: string;
  name: string;
  attempts: number;
  segment: string;
  openRate: number;
  startsAt: number;
  externalRef: string;
  timezone: string;
  expiresAt: number;
  status: ManualFlightPlanStatus;

  constructor(
    code: string,
    name: string,
    attempts: number,
    segment: string,
    openRate: number,
    startsAt: number,
    externalRef: string,
    timezone: string,
    expiresAt: number,
    status: ManualFlightPlanStatus,
  ) {
    this.code = code;
    this.name = name;
    this.attempts = attempts;
    this.segment = segment;
    this.openRate = openRate;
    this.startsAt = startsAt;
    this.externalRef = externalRef;
    this.timezone = timezone;
    this.expiresAt = expiresAt;
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

  canMoveTo(next: ManualFlightPlanStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "scheduled" || next === "completed";
      case "scheduled":
        return next === "completed";
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

  moveTo(next: ManualFlightPlanStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual flight plan ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  projectedExposure(): number {
    return Math.round((this.attempts + this.startsAt) * 100) / 100;
  }

  copy(): ManualFlightPlan {
    return new ManualFlightPlan(
      this.code,
      this.name,
      this.attempts,
      this.segment,
      this.openRate,
      this.startsAt,
      this.externalRef,
      this.timezone,
      this.expiresAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a manual flight plan in status planned. */
export function newManualFlightPlan(code: string, name: string): ManualFlightPlan {
  return new ManualFlightPlan(code, name, 0, "", 0, 0, "", "", 0, "planned");
}
