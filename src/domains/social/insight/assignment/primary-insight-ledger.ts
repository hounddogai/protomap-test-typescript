import * as text from "../../../../kit/text.js";

/** Where a primary insight ledger is in its life cycle. */
export type PrimaryInsightLedgerStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a primary insight ledger and its current status. */
export class PrimaryInsightLedger {
  code: string;
  name: string;
  endsAt: number;
  description: string;
  updatedAt: number;
  status: PrimaryInsightLedgerStatus;

  constructor(
    code: string,
    name: string,
    endsAt: number,
    description: string,
    updatedAt: number,
    status: PrimaryInsightLedgerStatus,
  ) {
    this.code = code;
    this.name = name;
    this.endsAt = endsAt;
    this.description = description;
    this.updatedAt = updatedAt;
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

  canMoveTo(next: PrimaryInsightLedgerStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "ready":
          case "draining":
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

  moveTo(next: PrimaryInsightLedgerStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary insight ledger ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  projectedVolume(): number {
    return Math.round(this.updatedAt * this.endsAt * 100) / 100;
  }

  copy(): PrimaryInsightLedger {
    return new PrimaryInsightLedger(this.code, this.name, this.endsAt, this.description, this.updatedAt, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a primary insight ledger in status idle. */
export function newPrimaryInsightLedger(code: string, name: string): PrimaryInsightLedger {
  return new PrimaryInsightLedger(code, name, 0, "", 0, "idle");
}
