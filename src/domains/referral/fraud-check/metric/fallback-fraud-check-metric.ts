/**
 * The fallback fraud check metric records of referral's fraud check work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a fallback fraud check metric is in its life cycle. */
export type FallbackFraudCheckMetricStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One fallback fraud check metric, with what the planners need to act on it. */
export class FallbackFraudCheckMetric {
  code: string;
  name: string;
  attempts: number;
  capacity: number;
  checksum: string;
  status: FallbackFraudCheckMetricStatus;

  constructor(
    code: string,
    name: string,
    attempts: number,
    capacity: number,
    checksum: string,
    status: FallbackFraudCheckMetricStatus,
  ) {
    this.code = code;
    this.name = name;
    this.attempts = attempts;
    this.capacity = capacity;
    this.checksum = checksum;
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

  canMoveTo(next: FallbackFraudCheckMetricStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved" || next === "rejected";
      case "approved":
        switch (next) {
          case "rejected":
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

  moveTo(next: FallbackFraudCheckMetricStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback fraud check metric ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  adjustedExposure(): number {
    return Math.round((this.attempts - this.capacity) * 100) / 100;
  }

  copy(): FallbackFraudCheckMetric {
    return new FallbackFraudCheckMetric(this.code, this.name, this.attempts, this.capacity, this.checksum, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a fallback fraud check metric in status proposed. */
export function newFallbackFraudCheckMetric(code: string, name: string): FallbackFraudCheckMetric {
  return new FallbackFraudCheckMetric(code, name, 0, 0, "", "proposed");
}
