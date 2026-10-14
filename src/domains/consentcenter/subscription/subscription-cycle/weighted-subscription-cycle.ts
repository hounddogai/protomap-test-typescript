/**
 * The weighted subscription cycle records of consentcenter's subscription work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a weighted subscription cycle is in its life cycle. */
export type WeightedSubscriptionCycleStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A weighted subscription cycle. Its code is unique within a tenant. */
export class WeightedSubscriptionCycle {
  code: string;
  title: string;
  source: string;
  cohort: string;
  budget: number;
  ownerId: string;
  limit: number;
  status: WeightedSubscriptionCycleStatus;

  constructor(
    code: string,
    title: string,
    source: string,
    cohort: string,
    budget: number,
    ownerId: string,
    limit: number,
    status: WeightedSubscriptionCycleStatus,
  ) {
    this.code = code;
    this.title = title;
    this.source = source;
    this.cohort = cohort;
    this.budget = budget;
    this.ownerId = ownerId;
    this.limit = limit;
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

  canMoveTo(next: WeightedSubscriptionCycleStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "in_progress":
          case "cancelled":
            return true;
        }
        return false;
      case "in_progress":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: WeightedSubscriptionCycleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted subscription cycle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  effectiveTotal(): number {
    return Math.round(this.limit * this.budget * 100) / 100;
  }

  copy(): WeightedSubscriptionCycle {
    return new WeightedSubscriptionCycle(
      this.code,
      this.title,
      this.source,
      this.cohort,
      this.budget,
      this.ownerId,
      this.limit,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a weighted subscription cycle in status planned. */
export function newWeightedSubscriptionCycle(code: string, title: string): WeightedSubscriptionCycle {
  return new WeightedSubscriptionCycle(code, title, "", "", 0, "", 0, "planned");
}
