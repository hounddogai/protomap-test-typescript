import * as text from "../../../../kit/text.js";

/** Where a weighted opt out ledger is in its life cycle. */
export type WeightedOptOutLedgerStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A weighted opt out ledger. Its code is unique within a tenant. */
export class WeightedOptOutLedger {
  code: string;
  title: string;
  durationMinutes: number;
  variant: string;
  currency: string;
  bid: number;
  status: WeightedOptOutLedgerStatus;

  constructor(
    code: string,
    title: string,
    durationMinutes: number,
    variant: string,
    currency: string,
    bid: number,
    status: WeightedOptOutLedgerStatus,
  ) {
    this.code = code;
    this.title = title;
    this.durationMinutes = durationMinutes;
    this.variant = variant;
    this.currency = currency;
    this.bid = bid;
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

  canMoveTo(next: WeightedOptOutLedgerStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "warming";
      case "warming":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "ready":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: WeightedOptOutLedgerStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted opt out ledger ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"weighted opt out ledger"} ${this.code}`;
  }

  effectiveLoad(): number {
    return Math.round((this.durationMinutes - this.bid) * 100) / 100;
  }

  copy(): WeightedOptOutLedger {
    return new WeightedOptOutLedger(
      this.code,
      this.title,
      this.durationMinutes,
      this.variant,
      this.currency,
      this.bid,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a weighted opt out ledger in status idle. */
export function newWeightedOptOutLedger(code: string, title: string): WeightedOptOutLedger {
  return new WeightedOptOutLedger(code, title, 0, "", "", 0, "idle");
}
