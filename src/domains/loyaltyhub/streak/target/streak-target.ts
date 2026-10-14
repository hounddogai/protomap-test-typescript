/**
 * The streak target records of loyaltyhub's streak work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a streak target is in its life cycle. */
export type StreakTargetStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a streak target and its current status. */
export class StreakTarget {
  code: string;
  label: string;
  cost: number;
  weight: number;
  bid: number;
  startsAt: number;
  score: number;
  campaignRef: string;
  status: StreakTargetStatus;

  constructor(
    code: string,
    label: string,
    cost: number,
    weight: number,
    bid: number,
    startsAt: number,
    score: number,
    campaignRef: string,
    status: StreakTargetStatus,
  ) {
    this.code = code;
    this.label = label;
    this.cost = cost;
    this.weight = weight;
    this.bid = bid;
    this.startsAt = startsAt;
    this.score = score;
    this.campaignRef = campaignRef;
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

  canMoveTo(next: StreakTargetStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "scheduled":
            return true;
        }
        return false;
      case "scheduled":
        return next === "completed" || next === "cancelled";
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

  moveTo(next: StreakTargetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`streak target ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  adjustedLoad(): number {
    return Math.round((this.cost - this.bid) * 100) / 100;
  }

  copy(): StreakTarget {
    return new StreakTarget(
      this.code,
      this.label,
      this.cost,
      this.weight,
      this.bid,
      this.startsAt,
      this.score,
      this.campaignRef,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a streak target in status planned. */
export function newStreakTarget(code: string, label: string): StreakTarget {
  return new StreakTarget(code, label, 0, 0, 0, 0, 0, "", "planned");
}
