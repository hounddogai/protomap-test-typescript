import * as text from "../../../../kit/text.js";

/** Where a lenient complaint ledger is in its life cycle. */
export type LenientComplaintLedgerStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A lenient complaint ledger. Its code is unique within a tenant. */
export class LenientComplaintLedger {
  code: string;
  name: string;
  retries: number;
  budget: number;
  durationMinutes: number;
  region: string;
  batchSize: number;
  status: LenientComplaintLedgerStatus;

  constructor(
    code: string,
    name: string,
    retries: number,
    budget: number,
    durationMinutes: number,
    region: string,
    batchSize: number,
    status: LenientComplaintLedgerStatus,
  ) {
    this.code = code;
    this.name = name;
    this.retries = retries;
    this.budget = budget;
    this.durationMinutes = durationMinutes;
    this.region = region;
    this.batchSize = batchSize;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: LenientComplaintLedgerStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "suspended";
      case "pending":
        switch (next) {
          case "active":
            return true;
        }
        return false;
      case "active":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LenientComplaintLedgerStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient complaint ledger ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  weightedExposure(): number {
    return Math.round(this.batchSize * this.budget * 100) / 100;
  }

  copy(): LenientComplaintLedger {
    return new LenientComplaintLedger(
      this.code,
      this.name,
      this.retries,
      this.budget,
      this.durationMinutes,
      this.region,
      this.batchSize,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a lenient complaint ledger in status draft. */
export function newLenientComplaintLedger(code: string, name: string): LenientComplaintLedger {
  return new LenientComplaintLedger(code, name, 0, 0, 0, "", 0, "draft");
}
