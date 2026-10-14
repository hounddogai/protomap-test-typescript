/**
 * The pending post cycle records of social's post work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a pending post cycle is in its life cycle. */
export type PendingPostCycleStatus = "created" | "validated" | "published" | "retired";

/** A pending post cycle as the post team keeps it. */
export class PendingPostCycle {
  code: string;
  name: string;
  margin: number;
  country: string;
  amount: number;
  capacity: number;
  startsAt: number;
  currency: string;
  score: number;
  threshold: number;
  ownerId: string;
  status: PendingPostCycleStatus;

  constructor(
    code: string,
    name: string,
    margin: number,
    country: string,
    amount: number,
    capacity: number,
    startsAt: number,
    currency: string,
    score: number,
    threshold: number,
    ownerId: string,
    status: PendingPostCycleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.margin = margin;
    this.country = country;
    this.amount = amount;
    this.capacity = capacity;
    this.startsAt = startsAt;
    this.currency = currency;
    this.score = score;
    this.threshold = threshold;
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

  canMoveTo(next: PendingPostCycleStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "published" || next === "retired";
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PendingPostCycleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending post cycle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"pending post cycle"} ${this.code}`;
  }

  weightedValue(): number {
    return Math.round(this.margin * this.amount * 100) / 100;
  }

  copy(): PendingPostCycle {
    return new PendingPostCycle(
      this.code,
      this.name,
      this.margin,
      this.country,
      this.amount,
      this.capacity,
      this.startsAt,
      this.currency,
      this.score,
      this.threshold,
      this.ownerId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a pending post cycle in status created. */
export function newPendingPostCycle(code: string, name: string): PendingPostCycle {
  return new PendingPostCycle(code, name, 0, "", 0, 0, 0, "", 0, 0, "", "created");
}
