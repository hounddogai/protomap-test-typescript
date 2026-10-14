/**
 * The rolling frequency ledger records of adops's frequency work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a rolling frequency ledger is in its life cycle. */
export type RollingFrequencyLedgerStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a rolling frequency ledger and its current status. */
export class RollingFrequencyLedger {
  code: string;
  name: string;
  maximum: number;
  source: string;
  margin: number;
  status: RollingFrequencyLedgerStatus;

  constructor(
    code: string,
    name: string,
    maximum: number,
    source: string,
    margin: number,
    status: RollingFrequencyLedgerStatus,
  ) {
    this.code = code;
    this.name = name;
    this.maximum = maximum;
    this.source = source;
    this.margin = margin;
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

  canMoveTo(next: RollingFrequencyLedgerStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved" || next === "withdrawn";
      case "approved":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: RollingFrequencyLedgerStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling frequency ledger ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  netExposure(): number {
    return Math.round(this.maximum * this.margin * 100) / 100;
  }

  copy(): RollingFrequencyLedger {
    return new RollingFrequencyLedger(this.code, this.name, this.maximum, this.source, this.margin, this.status);
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a rolling frequency ledger in status proposed. */
export function newRollingFrequencyLedger(code: string, name: string): RollingFrequencyLedger {
  return new RollingFrequencyLedger(code, name, 0, "", 0, "proposed");
}
