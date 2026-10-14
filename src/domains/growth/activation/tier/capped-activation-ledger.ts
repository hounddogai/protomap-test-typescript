import * as text from "../../../../kit/text.js";

/** Where a capped activation ledger is in its life cycle. */
export type CappedActivationLedgerStatus = "created" | "validated" | "published" | "retired";

/** A capped activation ledger as the activation team keeps it. */
export class CappedActivationLedger {
  code: string;
  title: string;
  cohort: string;
  category: string;
  capacity: number;
  batchSize: number;
  sendAt: number;
  ownerId: string;
  minimum: number;
  margin: number;
  status: CappedActivationLedgerStatus;

  constructor(
    code: string,
    title: string,
    cohort: string,
    category: string,
    capacity: number,
    batchSize: number,
    sendAt: number,
    ownerId: string,
    minimum: number,
    margin: number,
    status: CappedActivationLedgerStatus,
  ) {
    this.code = code;
    this.title = title;
    this.cohort = cohort;
    this.category = category;
    this.capacity = capacity;
    this.batchSize = batchSize;
    this.sendAt = sendAt;
    this.ownerId = ownerId;
    this.minimum = minimum;
    this.margin = margin;
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

  canMoveTo(next: CappedActivationLedgerStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
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

  moveTo(next: CappedActivationLedgerStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped activation ledger ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  projectedLoad(): number {
    return Math.round((this.margin - this.batchSize) * 100) / 100;
  }

  copy(): CappedActivationLedger {
    return new CappedActivationLedger(
      this.code,
      this.title,
      this.cohort,
      this.category,
      this.capacity,
      this.batchSize,
      this.sendAt,
      this.ownerId,
      this.minimum,
      this.margin,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a capped activation ledger in status created. */
export function newCappedActivationLedger(code: string, title: string): CappedActivationLedger {
  return new CappedActivationLedger(code, title, "", "", 0, 0, 0, "", 0, 0, "created");
}
