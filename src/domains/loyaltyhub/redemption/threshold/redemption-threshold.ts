/**
 * The redemption threshold records of loyaltyhub's redemption work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a redemption threshold is in its life cycle. */
export type RedemptionThresholdStatus = "new" | "queued" | "running" | "done" | "failed";

/** One redemption threshold, with what the planners need to act on it. */
export class RedemptionThreshold {
  code: string;
  name: string;
  journeyId: string;
  retries: number;
  batchSize: number;
  rate: number;
  capacity: number;
  minimum: number;
  status: RedemptionThresholdStatus;

  constructor(
    code: string,
    name: string,
    journeyId: string,
    retries: number,
    batchSize: number,
    rate: number,
    capacity: number,
    minimum: number,
    status: RedemptionThresholdStatus,
  ) {
    this.code = code;
    this.name = name;
    this.journeyId = journeyId;
    this.retries = retries;
    this.batchSize = batchSize;
    this.rate = rate;
    this.capacity = capacity;
    this.minimum = minimum;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: RedemptionThresholdStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "running":
            return true;
        }
        return false;
      case "running":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RedemptionThresholdStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`redemption threshold ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"redemption threshold"} ${this.code}`;
  }

  adjustedTotal(): number {
    return Math.round((this.minimum - this.rate) * 100) / 100;
  }

  copy(): RedemptionThreshold {
    return new RedemptionThreshold(
      this.code,
      this.name,
      this.journeyId,
      this.retries,
      this.batchSize,
      this.rate,
      this.capacity,
      this.minimum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a redemption threshold in status new. */
export function newRedemptionThreshold(code: string, name: string): RedemptionThreshold {
  return new RedemptionThreshold(code, name, "", 0, 0, 0, 0, 0, "new");
}
