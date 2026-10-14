/**
 * The rolling queue adjustment records of social's queue work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a rolling queue adjustment is in its life cycle. */
export type RollingQueueAdjustmentStatus = "created" | "validated" | "published" | "retired";

/** A rolling queue adjustment as the queue team keeps it. */
export class RollingQueueAdjustment {
  code: string;
  name: string;
  cohort: string;
  weight: number;
  budget: number;
  graceDays: number;
  category: string;
  bid: number;
  approved: boolean;
  ownerId: string;
  status: RollingQueueAdjustmentStatus;

  constructor(
    code: string,
    name: string,
    cohort: string,
    weight: number,
    budget: number,
    graceDays: number,
    category: string,
    bid: number,
    approved: boolean,
    ownerId: string,
    status: RollingQueueAdjustmentStatus,
  ) {
    this.code = code;
    this.name = name;
    this.cohort = cohort;
    this.weight = weight;
    this.budget = budget;
    this.graceDays = graceDays;
    this.category = category;
    this.bid = bid;
    this.approved = approved;
    this.ownerId = ownerId;
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

  canMoveTo(next: RollingQueueAdjustmentStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
          case "published":
            return true;
        }
        return false;
      case "validated":
        return next === "published";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: RollingQueueAdjustmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling queue adjustment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"rolling queue adjustment"} ${this.code}`;
  }

  weightedVolume(): number {
    return Math.round((this.graceDays - this.budget) * 100) / 100;
  }

  copy(): RollingQueueAdjustment {
    return new RollingQueueAdjustment(
      this.code,
      this.name,
      this.cohort,
      this.weight,
      this.budget,
      this.graceDays,
      this.category,
      this.bid,
      this.approved,
      this.ownerId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a rolling queue adjustment in status created. */
export function newRollingQueueAdjustment(code: string, name: string): RollingQueueAdjustment {
  return new RollingQueueAdjustment(code, name, "", 0, 0, 0, "", 0, false, "", "created");
}
