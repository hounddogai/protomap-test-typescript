/**
 * The tiered subscription allocation records of consentcenter's subscription work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a tiered subscription allocation is in its life cycle. */
export type TieredSubscriptionAllocationStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A tiered subscription allocation. Its code is unique within a tenant. */
export class TieredSubscriptionAllocation {
  code: string;
  title: string;
  score: number;
  channel: string;
  floorValue: number;
  unit: string;
  reviewer: string;
  windowDays: number;
  status: TieredSubscriptionAllocationStatus;

  constructor(
    code: string,
    title: string,
    score: number,
    channel: string,
    floorValue: number,
    unit: string,
    reviewer: string,
    windowDays: number,
    status: TieredSubscriptionAllocationStatus,
  ) {
    this.code = code;
    this.title = title;
    this.score = score;
    this.channel = channel;
    this.floorValue = floorValue;
    this.unit = unit;
    this.reviewer = reviewer;
    this.windowDays = windowDays;
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

  canMoveTo(next: TieredSubscriptionAllocationStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
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

  moveTo(next: TieredSubscriptionAllocationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered subscription allocation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  weightedTotal(): number {
    return Math.round(this.windowDays * this.floorValue * 100) / 100;
  }

  copy(): TieredSubscriptionAllocation {
    return new TieredSubscriptionAllocation(
      this.code,
      this.title,
      this.score,
      this.channel,
      this.floorValue,
      this.unit,
      this.reviewer,
      this.windowDays,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a tiered subscription allocation in status planned. */
export function newTieredSubscriptionAllocation(code: string, title: string): TieredSubscriptionAllocation {
  return new TieredSubscriptionAllocation(code, title, 0, "", 0, "", "", 0, "planned");
}
