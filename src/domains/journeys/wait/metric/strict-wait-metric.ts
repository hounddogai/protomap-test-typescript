/**
 * The strict wait metric records of journeys's wait work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a strict wait metric is in its life cycle. */
export type StrictWaitMetricStatus = "created" | "validated" | "published" | "retired";

/** A strict wait metric as the wait team keeps it. */
export class StrictWaitMetric {
  code: string;
  name: string;
  checksum: string;
  pinned: boolean;
  expiresAt: number;
  priority: number;
  graceDays: number;
  segment: string;
  status: StrictWaitMetricStatus;

  constructor(
    code: string,
    name: string,
    checksum: string,
    pinned: boolean,
    expiresAt: number,
    priority: number,
    graceDays: number,
    segment: string,
    status: StrictWaitMetricStatus,
  ) {
    this.code = code;
    this.name = name;
    this.checksum = checksum;
    this.pinned = pinned;
    this.expiresAt = expiresAt;
    this.priority = priority;
    this.graceDays = graceDays;
    this.segment = segment;
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

  canMoveTo(next: StrictWaitMetricStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
            return true;
        }
        return false;
      case "validated":
        return next === "retired";
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: StrictWaitMetricStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict wait metric ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"strict wait metric"} ${this.code}`;
  }

  weightedValue(): number {
    return Math.round((this.graceDays - this.expiresAt) * 100) / 100;
  }

  copy(): StrictWaitMetric {
    return new StrictWaitMetric(
      this.code,
      this.name,
      this.checksum,
      this.pinned,
      this.expiresAt,
      this.priority,
      this.graceDays,
      this.segment,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a strict wait metric in status created. */
export function newStrictWaitMetric(code: string, name: string): StrictWaitMetric {
  return new StrictWaitMetric(code, name, "", false, 0, 0, 0, "", "created");
}
