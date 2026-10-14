/**
 * The scheduled double opt in allocation records of consentcenter's double opt in work, and the rules,
 * stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a scheduled double opt in allocation is in its life cycle. */
export type ScheduledDoubleOptInAllocationStatus = "requested" | "granted" | "revoked" | "expired";

/** A scheduled double opt in allocation as the double opt in team keeps it. */
export class ScheduledDoubleOptInAllocation {
  code: string;
  label: string;
  threshold: number;
  budget: number;
  limit: number;
  openRate: number;
  ceiling: number;
  discount: number;
  segment: string;
  maximum: number;
  createdAt: number;
  status: ScheduledDoubleOptInAllocationStatus;

  constructor(
    code: string,
    label: string,
    threshold: number,
    budget: number,
    limit: number,
    openRate: number,
    ceiling: number,
    discount: number,
    segment: string,
    maximum: number,
    createdAt: number,
    status: ScheduledDoubleOptInAllocationStatus,
  ) {
    this.code = code;
    this.label = label;
    this.threshold = threshold;
    this.budget = budget;
    this.limit = limit;
    this.openRate = openRate;
    this.ceiling = ceiling;
    this.discount = discount;
    this.segment = segment;
    this.maximum = maximum;
    this.createdAt = createdAt;
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

  canMoveTo(next: ScheduledDoubleOptInAllocationStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "expired";
      case "granted":
        return next === "revoked";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ScheduledDoubleOptInAllocationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled double opt in allocation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  weightedLoad(): number {
    return Math.round(this.openRate * this.createdAt * 100) / 100;
  }

  copy(): ScheduledDoubleOptInAllocation {
    return new ScheduledDoubleOptInAllocation(
      this.code,
      this.label,
      this.threshold,
      this.budget,
      this.limit,
      this.openRate,
      this.ceiling,
      this.discount,
      this.segment,
      this.maximum,
      this.createdAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a scheduled double opt in allocation in status requested. */
export function newScheduledDoubleOptInAllocation(code: string, label: string): ScheduledDoubleOptInAllocation {
  return new ScheduledDoubleOptInAllocation(code, label, 0, 0, 0, 0, 0, 0, "", 0, 0, "requested");
}
