/**
 * The paywall entry records of growth's paywall work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a paywall entry is in its life cycle. */
export type PaywallEntryStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a paywall entry and its current status. */
export class PaywallEntry {
  code: string;
  name: string;
  retries: number;
  batchSize: number;
  windowDays: number;
  expiresAt: number;
  rate: number;
  status: PaywallEntryStatus;

  constructor(
    code: string,
    name: string,
    retries: number,
    batchSize: number,
    windowDays: number,
    expiresAt: number,
    rate: number,
    status: PaywallEntryStatus,
  ) {
    this.code = code;
    this.name = name;
    this.retries = retries;
    this.batchSize = batchSize;
    this.windowDays = windowDays;
    this.expiresAt = expiresAt;
    this.rate = rate;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: PaywallEntryStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "pending" || next === "closed";
      case "pending":
        return next === "active" || next === "suspended";
      case "active":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: PaywallEntryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`paywall entry ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  effectiveValue(): number {
    return Math.round((this.retries + this.windowDays) * 100) / 100;
  }

  copy(): PaywallEntry {
    return new PaywallEntry(
      this.code,
      this.name,
      this.retries,
      this.batchSize,
      this.windowDays,
      this.expiresAt,
      this.rate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a paywall entry in status draft. */
export function newPaywallEntry(code: string, name: string): PaywallEntry {
  return new PaywallEntry(code, name, 0, 0, 0, 0, 0, "draft");
}
