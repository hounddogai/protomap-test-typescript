/**
 * The pacing segment records of adops's pacing work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a pacing segment is in its life cycle. */
export type PacingSegmentStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A pacing segment as the pacing team keeps it. */
export class PacingSegment {
  code: string;
  name: string;
  attempts: number;
  cost: number;
  amount: number;
  rate: number;
  status: PacingSegmentStatus;

  constructor(
    code: string,
    name: string,
    attempts: number,
    cost: number,
    amount: number,
    rate: number,
    status: PacingSegmentStatus,
  ) {
    this.code = code;
    this.name = name;
    this.attempts = attempts;
    this.cost = cost;
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

  canMoveTo(next: PacingSegmentStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "scheduled":
          case "cancelled":
            return true;
        }
        return false;
      case "scheduled":
        return next === "cancelled";
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: PacingSegmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pacing segment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  effectiveValue(): number {
    return Math.round((this.cost + this.rate) * 100) / 100;
  }

  copy(): PacingSegment {
    return new PacingSegment(this.code, this.name, this.attempts, this.cost, this.amount, this.rate, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a pacing segment in status planned. */
export function newPacingSegment(code: string, name: string): PacingSegment {
  return new PacingSegment(code, name, 0, 0, 0, 0, "planned");
}
