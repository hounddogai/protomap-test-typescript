/**
 * The regional bid rule ledger records of adops's bid rule work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a regional bid rule ledger is in its life cycle. */
export type RegionalBidRuleLedgerStatus = "created" | "validated" | "published" | "retired";

/** One regional bid rule ledger, with what the planners need to act on it. */
export class RegionalBidRuleLedger {
  code: string;
  label: string;
  archived: boolean;
  openRate: number;
  attempts: number;
  retries: number;
  limit: number;
  amount: number;
  margin: number;
  weight: number;
  status: RegionalBidRuleLedgerStatus;

  constructor(
    code: string,
    label: string,
    archived: boolean,
    openRate: number,
    attempts: number,
    retries: number,
    limit: number,
    amount: number,
    margin: number,
    weight: number,
    status: RegionalBidRuleLedgerStatus,
  ) {
    this.code = code;
    this.label = label;
    this.archived = archived;
    this.openRate = openRate;
    this.attempts = attempts;
    this.retries = retries;
    this.limit = limit;
    this.amount = amount;
    this.margin = margin;
    this.weight = weight;
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

  canMoveTo(next: RegionalBidRuleLedgerStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: RegionalBidRuleLedgerStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional bid rule ledger ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  effectiveExposure(): number {
    return Math.round((this.amount - this.limit) * 100) / 100;
  }

  copy(): RegionalBidRuleLedger {
    return new RegionalBidRuleLedger(
      this.code,
      this.label,
      this.archived,
      this.openRate,
      this.attempts,
      this.retries,
      this.limit,
      this.amount,
      this.margin,
      this.weight,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a regional bid rule ledger in status created. */
export function newRegionalBidRuleLedger(code: string, label: string): RegionalBidRuleLedger {
  return new RegionalBidRuleLedger(code, label, false, 0, 0, 0, 0, 0, 0, 0, "created");
}
