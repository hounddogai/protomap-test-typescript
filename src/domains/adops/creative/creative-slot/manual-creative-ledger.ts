import * as text from "../../../../kit/text.js";

/** Where a manual creative ledger is in its life cycle. */
export type ManualCreativeLedgerStatus = "requested" | "granted" | "revoked" | "expired";

/** A manual creative ledger as the creative team keeps it. */
export class ManualCreativeLedger {
  code: string;
  title: string;
  source: string;
  score: number;
  windowDays: number;
  amount: number;
  country: string;
  status: ManualCreativeLedgerStatus;

  constructor(
    code: string,
    title: string,
    source: string,
    score: number,
    windowDays: number,
    amount: number,
    country: string,
    status: ManualCreativeLedgerStatus,
  ) {
    this.code = code;
    this.title = title;
    this.source = source;
    this.score = score;
    this.windowDays = windowDays;
    this.amount = amount;
    this.country = country;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: ManualCreativeLedgerStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "expired";
      case "granted":
        switch (next) {
          case "revoked":
            return true;
        }
        return false;
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ManualCreativeLedgerStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual creative ledger ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  projectedValue(): number {
    return Math.round(this.score * this.amount * 100) / 100;
  }

  copy(): ManualCreativeLedger {
    return new ManualCreativeLedger(
      this.code,
      this.title,
      this.source,
      this.score,
      this.windowDays,
      this.amount,
      this.country,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a manual creative ledger in status requested. */
export function newManualCreativeLedger(code: string, title: string): ManualCreativeLedger {
  return new ManualCreativeLedger(code, title, "", 0, 0, 0, "", "requested");
}
