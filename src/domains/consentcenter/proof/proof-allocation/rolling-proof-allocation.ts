/**
 * The rolling proof allocation records of consentcenter's proof work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a rolling proof allocation is in its life cycle. */
export type RollingProofAllocationStatus = "requested" | "granted" | "revoked" | "expired";

/** A rolling proof allocation as the proof team keeps it. */
export class RollingProofAllocation {
  code: string;
  title: string;
  amount: number;
  phone: string;
  source: string;
  weight: number;
  segment: string;
  checksum: string;
  priority: number;
  channel: string;
  journeyId: string;
  status: RollingProofAllocationStatus;

  constructor(
    code: string,
    title: string,
    amount: number,
    phone: string,
    source: string,
    weight: number,
    segment: string,
    checksum: string,
    priority: number,
    channel: string,
    journeyId: string,
    status: RollingProofAllocationStatus,
  ) {
    this.code = code;
    this.title = title;
    this.amount = amount;
    this.phone = phone;
    this.source = source;
    this.weight = weight;
    this.segment = segment;
    this.checksum = checksum;
    this.priority = priority;
    this.channel = channel;
    this.journeyId = journeyId;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: RollingProofAllocationStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "revoked":
          case "expired":
            return true;
        }
        return false;
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RollingProofAllocationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling proof allocation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  effectiveValue(): number {
    return Math.round((this.priority - this.weight) * 100) / 100;
  }

  copy(): RollingProofAllocation {
    return new RollingProofAllocation(
      this.code,
      this.title,
      this.amount,
      this.phone,
      this.source,
      this.weight,
      this.segment,
      this.checksum,
      this.priority,
      this.channel,
      this.journeyId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a rolling proof allocation in status requested. */
export function newRollingProofAllocation(code: string, title: string): RollingProofAllocation {
  return new RollingProofAllocation(code, title, 0, "", "", 0, "", "", 0, "", "", "requested");
}
