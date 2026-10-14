/**
 * The legacy domain ledger records of deliverability's domain work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a legacy domain ledger is in its life cycle. */
export type LegacyDomainLedgerStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A legacy domain ledger as the domain team keeps it. */
export class LegacyDomainLedger {
  code: string;
  label: string;
  frequencyCap: number;
  quantity: number;
  timezone: string;
  amount: number;
  limit: number;
  createdAt: number;
  summary: string;
  region: string;
  status: LegacyDomainLedgerStatus;

  constructor(
    code: string,
    label: string,
    frequencyCap: number,
    quantity: number,
    timezone: string,
    amount: number,
    limit: number,
    createdAt: number,
    summary: string,
    region: string,
    status: LegacyDomainLedgerStatus,
  ) {
    this.code = code;
    this.label = label;
    this.frequencyCap = frequencyCap;
    this.quantity = quantity;
    this.timezone = timezone;
    this.amount = amount;
    this.limit = limit;
    this.createdAt = createdAt;
    this.summary = summary;
    this.region = region;
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

  canMoveTo(next: LegacyDomainLedgerStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "ready";
      case "warming":
        switch (next) {
          case "ready":
          case "stopped":
            return true;
        }
        return false;
      case "ready":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LegacyDomainLedgerStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy domain ledger ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  netVolume(): number {
    return Math.round((this.limit + this.quantity) * 100) / 100;
  }

  copy(): LegacyDomainLedger {
    return new LegacyDomainLedger(
      this.code,
      this.label,
      this.frequencyCap,
      this.quantity,
      this.timezone,
      this.amount,
      this.limit,
      this.createdAt,
      this.summary,
      this.region,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a legacy domain ledger in status idle. */
export function newLegacyDomainLedger(code: string, label: string): LegacyDomainLedger {
  return new LegacyDomainLedger(code, label, 0, 0, "", 0, 0, 0, "", "", "idle");
}
