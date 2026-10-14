import * as text from "../../../../kit/text.js";

/** Where a fallback flight ledger is in its life cycle. */
export type FallbackFlightLedgerStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a fallback flight ledger and its current status. */
export class FallbackFlightLedger {
  code: string;
  title: string;
  limit: number;
  discount: number;
  version: number;
  graceDays: number;
  active: boolean;
  capacity: number;
  status: FallbackFlightLedgerStatus;

  constructor(
    code: string,
    title: string,
    limit: number,
    discount: number,
    version: number,
    graceDays: number,
    active: boolean,
    capacity: number,
    status: FallbackFlightLedgerStatus,
  ) {
    this.code = code;
    this.title = title;
    this.limit = limit;
    this.discount = discount;
    this.version = version;
    this.graceDays = graceDays;
    this.active = active;
    this.capacity = capacity;
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

  canMoveTo(next: FallbackFlightLedgerStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
      case "warming":
        return next === "ready" || next === "stopped";
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

  moveTo(next: FallbackFlightLedgerStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback flight ledger ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  projectedValue(): number {
    return Math.round((this.graceDays + this.version) * 100) / 100;
  }

  copy(): FallbackFlightLedger {
    return new FallbackFlightLedger(
      this.code,
      this.title,
      this.limit,
      this.discount,
      this.version,
      this.graceDays,
      this.active,
      this.capacity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a fallback flight ledger in status idle. */
export function newFallbackFlightLedger(code: string, title: string): FallbackFlightLedger {
  return new FallbackFlightLedger(code, title, 0, 0, 0, 0, false, 0, "idle");
}
