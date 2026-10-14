/**
 * The pacing ledger records of adops's pacing work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a pacing ledger is in its life cycle. */
export type PacingLedgerStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A pacing ledger. Its code is unique within a tenant. */
export class PacingLedger {
  code: string;
  name: string;
  startsAt: number;
  score: number;
  source: string;
  limit: number;
  bid: number;
  pinned: boolean;
  status: PacingLedgerStatus;

  constructor(
    code: string,
    name: string,
    startsAt: number,
    score: number,
    source: string,
    limit: number,
    bid: number,
    pinned: boolean,
    status: PacingLedgerStatus,
  ) {
    this.code = code;
    this.name = name;
    this.startsAt = startsAt;
    this.score = score;
    this.source = source;
    this.limit = limit;
    this.bid = bid;
    this.pinned = pinned;
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

  canMoveTo(next: PacingLedgerStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved" || next === "withdrawn";
      case "approved":
        switch (next) {
          case "rejected":
            return true;
        }
        return false;
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PacingLedgerStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pacing ledger ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  netValue(): number {
    return Math.round(this.score * this.limit * 100) / 100;
  }

  copy(): PacingLedger {
    return new PacingLedger(
      this.code,
      this.name,
      this.startsAt,
      this.score,
      this.source,
      this.limit,
      this.bid,
      this.pinned,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a pacing ledger in status proposed. */
export function newPacingLedger(code: string, name: string): PacingLedger {
  return new PacingLedger(code, name, 0, 0, "", 0, 0, false, "proposed");
}
