/**
 * The tiered opt out override records of consentcenter's opt out work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a tiered opt out override is in its life cycle. */
export type TieredOptOutOverrideStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a tiered opt out override and its current status. */
export class TieredOptOutOverride {
  code: string;
  name: string;
  reviewer: string;
  capacity: number;
  budget: number;
  amount: number;
  discount: number;
  summary: string;
  status: TieredOptOutOverrideStatus;

  constructor(
    code: string,
    name: string,
    reviewer: string,
    capacity: number,
    budget: number,
    amount: number,
    discount: number,
    summary: string,
    status: TieredOptOutOverrideStatus,
  ) {
    this.code = code;
    this.name = name;
    this.reviewer = reviewer;
    this.capacity = capacity;
    this.budget = budget;
    this.amount = amount;
    this.discount = discount;
    this.summary = summary;
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

  canMoveTo(next: TieredOptOutOverrideStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "in_progress";
      case "scheduled":
        return next === "cancelled";
      case "in_progress":
        return next === "completed";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: TieredOptOutOverrideStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered opt out override ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"tiered opt out override"} ${this.code}`;
  }

  netVolume(): number {
    return Math.round((this.discount - this.amount) * 100) / 100;
  }

  copy(): TieredOptOutOverride {
    return new TieredOptOutOverride(
      this.code,
      this.name,
      this.reviewer,
      this.capacity,
      this.budget,
      this.amount,
      this.discount,
      this.summary,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a tiered opt out override in status planned. */
export function newTieredOptOutOverride(code: string, name: string): TieredOptOutOverride {
  return new TieredOptOutOverride(code, name, "", 0, 0, 0, 0, "", "planned");
}
