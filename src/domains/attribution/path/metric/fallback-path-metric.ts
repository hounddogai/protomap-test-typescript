/**
 * The fallback path metric records of attribution's path work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a fallback path metric is in its life cycle. */
export type FallbackPathMetricStatus = "created" | "validated" | "published" | "retired";

/** One fallback path metric, with what the planners need to act on it. */
export class FallbackPathMetric {
  code: string;
  label: string;
  quantity: number;
  capacity: number;
  amount: number;
  bid: number;
  status: FallbackPathMetricStatus;

  constructor(
    code: string,
    label: string,
    quantity: number,
    capacity: number,
    amount: number,
    bid: number,
    status: FallbackPathMetricStatus,
  ) {
    this.code = code;
    this.label = label;
    this.quantity = quantity;
    this.capacity = capacity;
    this.amount = amount;
    this.bid = bid;
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

  canMoveTo(next: FallbackPathMetricStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "published" || next === "retired";
      case "validated":
        return next === "retired";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: FallbackPathMetricStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback path metric ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"fallback path metric"} ${this.code}`;
  }

  projectedExposure(): number {
    return Math.round((this.capacity - this.quantity) * 100) / 100;
  }

  copy(): FallbackPathMetric {
    return new FallbackPathMetric(
      this.code,
      this.label,
      this.quantity,
      this.capacity,
      this.amount,
      this.bid,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a fallback path metric in status created. */
export function newFallbackPathMetric(code: string, label: string): FallbackPathMetric {
  return new FallbackPathMetric(code, label, 0, 0, 0, 0, "created");
}
