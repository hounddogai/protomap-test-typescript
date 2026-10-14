import * as text from "../../../../kit/text.js";

/** Where a bid rule ledger is in its life cycle. */
export type BidRuleLedgerStatus = "requested" | "granted" | "revoked" | "expired";

/** A bid rule ledger. Its code is unique within a tenant. */
export class BidRuleLedger {
  code: string;
  label: string;
  batchSize: number;
  notes: string;
  tags: string[];
  status: BidRuleLedgerStatus;

  constructor(
    code: string,
    label: string,
    batchSize: number,
    notes: string,
    tags: string[],
    status: BidRuleLedgerStatus,
  ) {
    this.code = code;
    this.label = label;
    this.batchSize = batchSize;
    this.notes = notes;
    this.tags = tags;
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

  canMoveTo(next: BidRuleLedgerStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "revoked":
          case "expired":
            return true;
        }
        return false;
      case "granted":
        return next === "revoked";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: BidRuleLedgerStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`bid rule ledger ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  measuredValue(): number {
    return this.batchSize;
  }

  copy(): BidRuleLedger {
    return new BidRuleLedger(this.code, this.label, this.batchSize, this.notes, this.tags, this.status);
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a bid rule ledger in status requested. */
export function newBidRuleLedger(code: string, label: string): BidRuleLedger {
  return new BidRuleLedger(code, label, 0, "", [], "requested");
}
