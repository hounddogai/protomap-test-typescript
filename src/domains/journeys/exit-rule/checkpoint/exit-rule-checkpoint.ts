/**
 * The exit rule checkpoint records of journeys's exit rule work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a exit rule checkpoint is in its life cycle. */
export type ExitRuleCheckpointStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A exit rule checkpoint. Its code is unique within a tenant. */
export class ExitRuleCheckpoint {
  code: string;
  title: string;
  version: number;
  reviewer: string;
  capacity: number;
  floorValue: number;
  bid: number;
  currency: string;
  amount: number;
  rate: number;
  status: ExitRuleCheckpointStatus;

  constructor(
    code: string,
    title: string,
    version: number,
    reviewer: string,
    capacity: number,
    floorValue: number,
    bid: number,
    currency: string,
    amount: number,
    rate: number,
    status: ExitRuleCheckpointStatus,
  ) {
    this.code = code;
    this.title = title;
    this.version = version;
    this.reviewer = reviewer;
    this.capacity = capacity;
    this.floorValue = floorValue;
    this.bid = bid;
    this.currency = currency;
    this.amount = amount;
    this.rate = rate;
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

  canMoveTo(next: ExitRuleCheckpointStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "in_progress" || next === "completed";
      case "scheduled":
        switch (next) {
          case "completed":
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
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ExitRuleCheckpointStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`exit rule checkpoint ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${"exit rule checkpoint"} ${this.code}`;
  }

  adjustedTotal(): number {
    return Math.round((this.rate + this.version) * 100) / 100;
  }

  copy(): ExitRuleCheckpoint {
    return new ExitRuleCheckpoint(
      this.code,
      this.title,
      this.version,
      this.reviewer,
      this.capacity,
      this.floorValue,
      this.bid,
      this.currency,
      this.amount,
      this.rate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a exit rule checkpoint in status planned. */
export function newExitRuleCheckpoint(code: string, title: string): ExitRuleCheckpoint {
  return new ExitRuleCheckpoint(code, title, 0, "", 0, 0, 0, "", 0, 0, "planned");
}
