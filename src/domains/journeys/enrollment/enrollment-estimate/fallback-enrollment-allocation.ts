import * as text from "../../../../kit/text.js";

/** Where a fallback enrollment allocation is in its life cycle. */
export type FallbackEnrollmentAllocationStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One fallback enrollment allocation, with what the planners need to act on it. */
export class FallbackEnrollmentAllocation {
  code: string;
  label: string;
  version: number;
  visible: boolean;
  batchSize: number;
  country: string;
  minimum: number;
  clicks: number;
  currency: string;
  rate: number;
  bid: number;
  status: FallbackEnrollmentAllocationStatus;

  constructor(
    code: string,
    label: string,
    version: number,
    visible: boolean,
    batchSize: number,
    country: string,
    minimum: number,
    clicks: number,
    currency: string,
    rate: number,
    bid: number,
    status: FallbackEnrollmentAllocationStatus,
  ) {
    this.code = code;
    this.label = label;
    this.version = version;
    this.visible = visible;
    this.batchSize = batchSize;
    this.country = country;
    this.minimum = minimum;
    this.clicks = clicks;
    this.currency = currency;
    this.rate = rate;
    this.bid = bid;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: FallbackEnrollmentAllocationStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
      case "warming":
        return next === "stopped";
      case "ready":
        return next === "stopped";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: FallbackEnrollmentAllocationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback enrollment allocation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  displayLabel(): string {
    return `${"fallback enrollment allocation"} ${this.code}`;
  }

  adjustedExposure(): number {
    return Math.round((this.version - this.batchSize) * 100) / 100;
  }

  copy(): FallbackEnrollmentAllocation {
    return new FallbackEnrollmentAllocation(
      this.code,
      this.label,
      this.version,
      this.visible,
      this.batchSize,
      this.country,
      this.minimum,
      this.clicks,
      this.currency,
      this.rate,
      this.bid,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a fallback enrollment allocation in status idle. */
export function newFallbackEnrollmentAllocation(code: string, label: string): FallbackEnrollmentAllocation {
  return new FallbackEnrollmentAllocation(code, label, 0, false, 0, "", 0, 0, "", 0, 0, "idle");
}
