import * as text from "../../../../kit/text.js";

/** Where a global frequency ledger is in its life cycle. */
export type GlobalFrequencyLedgerStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A global frequency ledger as the frequency team keeps it. */
export class GlobalFrequencyLedger {
  code: string;
  title: string;
  createdAt: number;
  version: number;
  bid: number;
  impressions: number;
  sequence: number;
  quantity: number;
  status: GlobalFrequencyLedgerStatus;

  constructor(
    code: string,
    title: string,
    createdAt: number,
    version: number,
    bid: number,
    impressions: number,
    sequence: number,
    quantity: number,
    status: GlobalFrequencyLedgerStatus,
  ) {
    this.code = code;
    this.title = title;
    this.createdAt = createdAt;
    this.version = version;
    this.bid = bid;
    this.impressions = impressions;
    this.sequence = sequence;
    this.quantity = quantity;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: GlobalFrequencyLedgerStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "resolved";
      case "in_review":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "resolved":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: GlobalFrequencyLedgerStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global frequency ledger ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  weightedLoad(): number {
    return Math.round((this.quantity + this.sequence) * 100) / 100;
  }

  copy(): GlobalFrequencyLedger {
    return new GlobalFrequencyLedger(
      this.code,
      this.title,
      this.createdAt,
      this.version,
      this.bid,
      this.impressions,
      this.sequence,
      this.quantity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a global frequency ledger in status open. */
export function newGlobalFrequencyLedger(code: string, title: string): GlobalFrequencyLedger {
  return new GlobalFrequencyLedger(code, title, 0, 0, 0, 0, 0, 0, "open");
}
