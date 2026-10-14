/**
 * The adaptive frequency digest records of adops's frequency work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a adaptive frequency digest is in its life cycle. */
export type AdaptiveFrequencyDigestStatus = "created" | "validated" | "published" | "retired";

/** A adaptive frequency digest as the frequency team keeps it. */
export class AdaptiveFrequencyDigest {
  code: string;
  name: string;
  sequence: number;
  limit: number;
  capacity: number;
  bid: number;
  quantity: number;
  status: AdaptiveFrequencyDigestStatus;

  constructor(
    code: string,
    name: string,
    sequence: number,
    limit: number,
    capacity: number,
    bid: number,
    quantity: number,
    status: AdaptiveFrequencyDigestStatus,
  ) {
    this.code = code;
    this.name = name;
    this.sequence = sequence;
    this.limit = limit;
    this.capacity = capacity;
    this.bid = bid;
    this.quantity = quantity;
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

  canMoveTo(next: AdaptiveFrequencyDigestStatus): boolean {
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

  moveTo(next: AdaptiveFrequencyDigestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive frequency digest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"adaptive frequency digest"} ${this.code}`;
  }

  adjustedExposure(): number {
    return Math.round((this.bid + this.quantity) * 100) / 100;
  }

  copy(): AdaptiveFrequencyDigest {
    return new AdaptiveFrequencyDigest(
      this.code,
      this.name,
      this.sequence,
      this.limit,
      this.capacity,
      this.bid,
      this.quantity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a adaptive frequency digest in status created. */
export function newAdaptiveFrequencyDigest(code: string, name: string): AdaptiveFrequencyDigest {
  return new AdaptiveFrequencyDigest(code, name, 0, 0, 0, 0, 0, "created");
}
