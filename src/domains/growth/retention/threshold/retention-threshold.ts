/**
 * The retention threshold records of growth's retention work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a retention threshold is in its life cycle. */
export type RetentionThresholdStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A retention threshold as the retention team keeps it. */
export class RetentionThreshold {
  code: string;
  name: string;
  threshold: number;
  cohort: string;
  expiresAt: number;
  category: string;
  startsAt: number;
  status: RetentionThresholdStatus;

  constructor(
    code: string,
    name: string,
    threshold: number,
    cohort: string,
    expiresAt: number,
    category: string,
    startsAt: number,
    status: RetentionThresholdStatus,
  ) {
    this.code = code;
    this.name = name;
    this.threshold = threshold;
    this.cohort = cohort;
    this.expiresAt = expiresAt;
    this.category = category;
    this.startsAt = startsAt;
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

  canMoveTo(next: RetentionThresholdStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved" || next === "rejected";
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RetentionThresholdStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`retention threshold ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  adjustedValue(): number {
    return Math.round((this.startsAt - this.threshold) * 100) / 100;
  }

  copy(): RetentionThreshold {
    return new RetentionThreshold(
      this.code,
      this.name,
      this.threshold,
      this.cohort,
      this.expiresAt,
      this.category,
      this.startsAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a retention threshold in status proposed. */
export function newRetentionThreshold(code: string, name: string): RetentionThreshold {
  return new RetentionThreshold(code, name, 0, "", 0, "", 0, "proposed");
}
