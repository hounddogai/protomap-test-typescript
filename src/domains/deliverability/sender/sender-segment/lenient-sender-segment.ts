/**
 * The lenient sender segment records of deliverability's sender work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a lenient sender segment is in its life cycle. */
export type LenientSenderSegmentStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A lenient sender segment as the sender team keeps it. */
export class LenientSenderSegment {
  code: string;
  name: string;
  updatedAt: number;
  region: string;
  campaignRef: string;
  source: string;
  budget: number;
  limit: number;
  amount: number;
  quantity: number;
  status: LenientSenderSegmentStatus;

  constructor(
    code: string,
    name: string,
    updatedAt: number,
    region: string,
    campaignRef: string,
    source: string,
    budget: number,
    limit: number,
    amount: number,
    quantity: number,
    status: LenientSenderSegmentStatus,
  ) {
    this.code = code;
    this.name = name;
    this.updatedAt = updatedAt;
    this.region = region;
    this.campaignRef = campaignRef;
    this.source = source;
    this.budget = budget;
    this.limit = limit;
    this.amount = amount;
    this.quantity = quantity;
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

  canMoveTo(next: LenientSenderSegmentStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LenientSenderSegmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient sender segment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  netLoad(): number {
    return Math.round((this.limit - this.updatedAt) * 100) / 100;
  }

  copy(): LenientSenderSegment {
    return new LenientSenderSegment(
      this.code,
      this.name,
      this.updatedAt,
      this.region,
      this.campaignRef,
      this.source,
      this.budget,
      this.limit,
      this.amount,
      this.quantity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a lenient sender segment in status planned. */
export function newLenientSenderSegment(code: string, name: string): LenientSenderSegment {
  return new LenientSenderSegment(code, name, 0, "", "", "", 0, 0, 0, 0, "planned");
}
