import * as text from "../../../../kit/text.js";

/** Where a approval ledger is in its life cycle. */
export type ApprovalLedgerStatus = "created" | "validated" | "published" | "retired";

/** A approval ledger as the approval team keeps it. */
export class ApprovalLedger {
  code: string;
  name: string;
  rate: number;
  budget: number;
  margin: number;
  ownerId: string;
  status: ApprovalLedgerStatus;

  constructor(
    code: string,
    name: string,
    rate: number,
    budget: number,
    margin: number,
    ownerId: string,
    status: ApprovalLedgerStatus,
  ) {
    this.code = code;
    this.name = name;
    this.rate = rate;
    this.budget = budget;
    this.margin = margin;
    this.ownerId = ownerId;
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

  canMoveTo(next: ApprovalLedgerStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "retired":
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

  moveTo(next: ApprovalLedgerStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`approval ledger ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"approval ledger"} ${this.code}`;
  }

  effectiveTotal(): number {
    return Math.round(this.margin * this.budget * 100) / 100;
  }

  copy(): ApprovalLedger {
    return new ApprovalLedger(this.code, this.name, this.rate, this.budget, this.margin, this.ownerId, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a approval ledger in status created. */
export function newApprovalLedger(code: string, name: string): ApprovalLedger {
  return new ApprovalLedger(code, name, 0, 0, 0, "", "created");
}
