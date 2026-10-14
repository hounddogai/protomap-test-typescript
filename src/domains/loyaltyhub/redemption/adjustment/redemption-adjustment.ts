/**
 * The redemption adjustment records of loyaltyhub's redemption work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a redemption adjustment is in its life cycle. */
export type RedemptionAdjustmentStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a redemption adjustment and its current status. */
export class RedemptionAdjustment {
  code: string;
  name: string;
  limit: number;
  ownerId: string;
  startsAt: number;
  status: RedemptionAdjustmentStatus;

  constructor(
    code: string,
    name: string,
    limit: number,
    ownerId: string,
    startsAt: number,
    status: RedemptionAdjustmentStatus,
  ) {
    this.code = code;
    this.name = name;
    this.limit = limit;
    this.ownerId = ownerId;
    this.startsAt = startsAt;
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

  canMoveTo(next: RedemptionAdjustmentStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "in_progress":
            return true;
        }
        return false;
      case "scheduled":
        return next === "in_progress" || next === "cancelled";
      case "in_progress":
        switch (next) {
          case "completed":
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

  moveTo(next: RedemptionAdjustmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`redemption adjustment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  weightedExposure(): number {
    return Math.round(this.limit * this.startsAt * 100) / 100;
  }

  copy(): RedemptionAdjustment {
    return new RedemptionAdjustment(this.code, this.name, this.limit, this.ownerId, this.startsAt, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a redemption adjustment in status planned. */
export function newRedemptionAdjustment(code: string, name: string): RedemptionAdjustment {
  return new RedemptionAdjustment(code, name, 0, "", 0, "planned");
}
