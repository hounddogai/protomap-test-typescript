/**
 * The credit target records of attribution's credit work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a credit target is in its life cycle. */
export type CreditTargetStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A credit target as the credit team keeps it. */
export class CreditTarget {
  code: string;
  name: string;
  budget: number;
  channel: string;
  retries: number;
  windowDays: number;
  discount: number;
  batchSize: number;
  version: number;
  pinned: boolean;
  threshold: number;
  status: CreditTargetStatus;

  constructor(
    code: string,
    name: string,
    budget: number,
    channel: string,
    retries: number,
    windowDays: number,
    discount: number,
    batchSize: number,
    version: number,
    pinned: boolean,
    threshold: number,
    status: CreditTargetStatus,
  ) {
    this.code = code;
    this.name = name;
    this.budget = budget;
    this.channel = channel;
    this.retries = retries;
    this.windowDays = windowDays;
    this.discount = discount;
    this.batchSize = batchSize;
    this.version = version;
    this.pinned = pinned;
    this.threshold = threshold;
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

  canMoveTo(next: CreditTargetStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "rejected" || next === "withdrawn";
      case "approved":
        return next === "rejected";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: CreditTargetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`credit target ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${"credit target"} ${this.code}`;
  }

  effectiveValue(): number {
    return Math.round((this.windowDays - this.retries) * 100) / 100;
  }

  copy(): CreditTarget {
    return new CreditTarget(
      this.code,
      this.name,
      this.budget,
      this.channel,
      this.retries,
      this.windowDays,
      this.discount,
      this.batchSize,
      this.version,
      this.pinned,
      this.threshold,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a credit target in status proposed. */
export function newCreditTarget(code: string, name: string): CreditTarget {
  return new CreditTarget(code, name, 0, "", 0, 0, 0, 0, 0, false, 0, "proposed");
}
