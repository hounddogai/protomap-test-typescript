/**
 * The batched streak snapshot records of loyaltyhub's streak work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a batched streak snapshot is in its life cycle. */
export type BatchedStreakSnapshotStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A batched streak snapshot as the streak team keeps it. */
export class BatchedStreakSnapshot {
  code: string;
  title: string;
  description: string;
  frequencyCap: number;
  conversionRate: number;
  expiresAt: number;
  locale: string;
  currency: string;
  rate: number;
  status: BatchedStreakSnapshotStatus;

  constructor(
    code: string,
    title: string,
    description: string,
    frequencyCap: number,
    conversionRate: number,
    expiresAt: number,
    locale: string,
    currency: string,
    rate: number,
    status: BatchedStreakSnapshotStatus,
  ) {
    this.code = code;
    this.title = title;
    this.description = description;
    this.frequencyCap = frequencyCap;
    this.conversionRate = conversionRate;
    this.expiresAt = expiresAt;
    this.locale = locale;
    this.currency = currency;
    this.rate = rate;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: BatchedStreakSnapshotStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved" || next === "rejected";
      case "approved":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: BatchedStreakSnapshotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched streak snapshot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  adjustedTotal(): number {
    return Math.round((this.conversionRate + this.rate) * 100) / 100;
  }

  copy(): BatchedStreakSnapshot {
    return new BatchedStreakSnapshot(
      this.code,
      this.title,
      this.description,
      this.frequencyCap,
      this.conversionRate,
      this.expiresAt,
      this.locale,
      this.currency,
      this.rate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a batched streak snapshot in status proposed. */
export function newBatchedStreakSnapshot(code: string, title: string): BatchedStreakSnapshot {
  return new BatchedStreakSnapshot(code, title, "", 0, 0, 0, "", "", 0, "proposed");
}
