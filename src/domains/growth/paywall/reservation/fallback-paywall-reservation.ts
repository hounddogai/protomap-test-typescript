/**
 * The fallback paywall reservation records of growth's paywall work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a fallback paywall reservation is in its life cycle. */
export type FallbackPaywallReservationStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A fallback paywall reservation. Its code is unique within a tenant. */
export class FallbackPaywallReservation {
  code: string;
  label: string;
  channel: string;
  budget: number;
  checksum: string;
  batchSize: number;
  status: FallbackPaywallReservationStatus;

  constructor(
    code: string,
    label: string,
    channel: string,
    budget: number,
    checksum: string,
    batchSize: number,
    status: FallbackPaywallReservationStatus,
  ) {
    this.code = code;
    this.label = label;
    this.channel = channel;
    this.budget = budget;
    this.checksum = checksum;
    this.batchSize = batchSize;
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

  canMoveTo(next: FallbackPaywallReservationStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "withdrawn";
      case "approved":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: FallbackPaywallReservationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback paywall reservation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  effectiveValue(): number {
    return Math.round((this.budget + this.batchSize) * 100) / 100;
  }

  copy(): FallbackPaywallReservation {
    return new FallbackPaywallReservation(
      this.code,
      this.label,
      this.channel,
      this.budget,
      this.checksum,
      this.batchSize,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a fallback paywall reservation in status proposed. */
export function newFallbackPaywallReservation(code: string, label: string): FallbackPaywallReservation {
  return new FallbackPaywallReservation(code, label, "", 0, "", 0, "proposed");
}
