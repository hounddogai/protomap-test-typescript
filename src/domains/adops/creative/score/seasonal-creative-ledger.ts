import * as text from "../../../../kit/text.js";

/** Where a seasonal creative ledger is in its life cycle. */
export type SeasonalCreativeLedgerStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One seasonal creative ledger, with what the planners need to act on it. */
export class SeasonalCreativeLedger {
  code: string;
  label: string;
  country: string;
  sendAt: number;
  graceDays: number;
  quantity: number;
  openRate: number;
  ownerId: string;
  limit: number;
  status: SeasonalCreativeLedgerStatus;

  constructor(
    code: string,
    label: string,
    country: string,
    sendAt: number,
    graceDays: number,
    quantity: number,
    openRate: number,
    ownerId: string,
    limit: number,
    status: SeasonalCreativeLedgerStatus,
  ) {
    this.code = code;
    this.label = label;
    this.country = country;
    this.sendAt = sendAt;
    this.graceDays = graceDays;
    this.quantity = quantity;
    this.openRate = openRate;
    this.ownerId = ownerId;
    this.limit = limit;
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

  canMoveTo(next: SeasonalCreativeLedgerStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "warming" || next === "stopped";
      case "warming":
        return next === "ready" || next === "stopped";
      case "ready":
        return next === "draining";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: SeasonalCreativeLedgerStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal creative ledger ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  projectedTotal(): number {
    return Math.round(this.sendAt * this.graceDays * 100) / 100;
  }

  copy(): SeasonalCreativeLedger {
    return new SeasonalCreativeLedger(
      this.code,
      this.label,
      this.country,
      this.sendAt,
      this.graceDays,
      this.quantity,
      this.openRate,
      this.ownerId,
      this.limit,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a seasonal creative ledger in status idle. */
export function newSeasonalCreativeLedger(code: string, label: string): SeasonalCreativeLedger {
  return new SeasonalCreativeLedger(code, label, "", 0, 0, 0, 0, "", 0, "idle");
}
