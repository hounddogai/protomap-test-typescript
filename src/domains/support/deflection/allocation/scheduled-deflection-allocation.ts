/**
 * The scheduled deflection allocation records of support's deflection work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a scheduled deflection allocation is in its life cycle. */
export type ScheduledDeflectionAllocationStatus = "requested" | "granted" | "revoked" | "expired";

/** A scheduled deflection allocation. Its code is unique within a tenant. */
export class ScheduledDeflectionAllocation {
  code: string;
  label: string;
  windowDays: number;
  startsAt: number;
  contactEmail: string;
  graceDays: number;
  updatedAt: number;
  threshold: number;
  status: ScheduledDeflectionAllocationStatus;

  constructor(
    code: string,
    label: string,
    windowDays: number,
    startsAt: number,
    contactEmail: string,
    graceDays: number,
    updatedAt: number,
    threshold: number,
    status: ScheduledDeflectionAllocationStatus,
  ) {
    this.code = code;
    this.label = label;
    this.windowDays = windowDays;
    this.startsAt = startsAt;
    this.contactEmail = contactEmail;
    this.graceDays = graceDays;
    this.updatedAt = updatedAt;
    this.threshold = threshold;
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

  canMoveTo(next: ScheduledDeflectionAllocationStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted" || next === "revoked";
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ScheduledDeflectionAllocationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled deflection allocation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  projectedTotal(): number {
    return Math.round(this.windowDays * this.threshold * 100) / 100;
  }

  copy(): ScheduledDeflectionAllocation {
    return new ScheduledDeflectionAllocation(
      this.code,
      this.label,
      this.windowDays,
      this.startsAt,
      this.contactEmail,
      this.graceDays,
      this.updatedAt,
      this.threshold,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a scheduled deflection allocation in status requested. */
export function newScheduledDeflectionAllocation(code: string, label: string): ScheduledDeflectionAllocation {
  return new ScheduledDeflectionAllocation(code, label, 0, 0, "", 0, 0, 0, "requested");
}
