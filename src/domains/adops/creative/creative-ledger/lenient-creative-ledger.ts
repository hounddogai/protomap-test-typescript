/**
 * The lenient creative ledger records of adops's creative work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a lenient creative ledger is in its life cycle. */
export type LenientCreativeLedgerStatus = "created" | "validated" | "published" | "retired";

/** The record of a lenient creative ledger and its current status. */
export class LenientCreativeLedger {
  code: string;
  title: string;
  checksum: string;
  reviewer: string;
  updatedAt: number;
  category: string;
  createdAt: number;
  status: LenientCreativeLedgerStatus;

  constructor(
    code: string,
    title: string,
    checksum: string,
    reviewer: string,
    updatedAt: number,
    category: string,
    createdAt: number,
    status: LenientCreativeLedgerStatus,
  ) {
    this.code = code;
    this.title = title;
    this.checksum = checksum;
    this.reviewer = reviewer;
    this.updatedAt = updatedAt;
    this.category = category;
    this.createdAt = createdAt;
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

  canMoveTo(next: LenientCreativeLedgerStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
          case "published":
            return true;
        }
        return false;
      case "validated":
        return next === "published";
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LenientCreativeLedgerStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient creative ledger ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  adjustedTotal(): number {
    return Math.round(this.updatedAt * this.createdAt * 100) / 100;
  }

  copy(): LenientCreativeLedger {
    return new LenientCreativeLedger(
      this.code,
      this.title,
      this.checksum,
      this.reviewer,
      this.updatedAt,
      this.category,
      this.createdAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a lenient creative ledger in status created. */
export function newLenientCreativeLedger(code: string, title: string): LenientCreativeLedger {
  return new LenientCreativeLedger(code, title, "", "", 0, "", 0, "created");
}
