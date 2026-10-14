/**
 * The domain claim records of deliverability's domain work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a domain claim is in its life cycle. */
export type DomainClaimStatus = "created" | "validated" | "published" | "retired";

/** The record of a domain claim and its current status. */
export class DomainClaim {
  code: string;
  name: string;
  graceDays: number;
  phone: string;
  channel: string;
  threshold: number;
  reviewer: string;
  unit: string;
  status: DomainClaimStatus;

  constructor(
    code: string,
    name: string,
    graceDays: number,
    phone: string,
    channel: string,
    threshold: number,
    reviewer: string,
    unit: string,
    status: DomainClaimStatus,
  ) {
    this.code = code;
    this.name = name;
    this.graceDays = graceDays;
    this.phone = phone;
    this.channel = channel;
    this.threshold = threshold;
    this.reviewer = reviewer;
    this.unit = unit;
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

  canMoveTo(next: DomainClaimStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "published":
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

  moveTo(next: DomainClaimStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`domain claim ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  adjustedValue(): number {
    return Math.round((this.threshold + this.graceDays) * 100) / 100;
  }

  copy(): DomainClaim {
    return new DomainClaim(
      this.code,
      this.name,
      this.graceDays,
      this.phone,
      this.channel,
      this.threshold,
      this.reviewer,
      this.unit,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a domain claim in status created. */
export function newDomainClaim(code: string, name: string): DomainClaim {
  return new DomainClaim(code, name, 0, "", "", 0, "", "", "created");
}
