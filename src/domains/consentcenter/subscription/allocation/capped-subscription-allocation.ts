/**
 * The capped subscription allocation records of consentcenter's subscription work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a capped subscription allocation is in its life cycle. */
export type CappedSubscriptionAllocationStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a capped subscription allocation and its current status. */
export class CappedSubscriptionAllocation {
  code: string;
  name: string;
  updatedAt: number;
  openRate: number;
  priority: number;
  status: CappedSubscriptionAllocationStatus;

  constructor(
    code: string,
    name: string,
    updatedAt: number,
    openRate: number,
    priority: number,
    status: CappedSubscriptionAllocationStatus,
  ) {
    this.code = code;
    this.name = name;
    this.updatedAt = updatedAt;
    this.openRate = openRate;
    this.priority = priority;
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

  canMoveTo(next: CappedSubscriptionAllocationStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "ready":
          case "stopped":
            return true;
        }
        return false;
      case "warming":
        return next === "stopped";
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

  moveTo(next: CappedSubscriptionAllocationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped subscription allocation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  effectiveExposure(): number {
    return Math.round(this.openRate * this.updatedAt * 100) / 100;
  }

  copy(): CappedSubscriptionAllocation {
    return new CappedSubscriptionAllocation(
      this.code,
      this.name,
      this.updatedAt,
      this.openRate,
      this.priority,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a capped subscription allocation in status idle. */
export function newCappedSubscriptionAllocation(code: string, name: string): CappedSubscriptionAllocation {
  return new CappedSubscriptionAllocation(code, name, 0, 0, 0, "idle");
}
