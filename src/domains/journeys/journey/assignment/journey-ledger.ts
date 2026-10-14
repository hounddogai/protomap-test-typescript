import * as text from "../../../../kit/text.js";

/** Where a journey ledger is in its life cycle. */
export type JourneyLedgerStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a journey ledger and its current status. */
export class JourneyLedger {
  code: string;
  title: string;
  maximum: number;
  archived: boolean;
  retries: number;
  notes: string;
  quantity: number;
  capacity: number;
  budget: number;
  variant: string;
  floorValue: number;
  status: JourneyLedgerStatus;

  constructor(
    code: string,
    title: string,
    maximum: number,
    archived: boolean,
    retries: number,
    notes: string,
    quantity: number,
    capacity: number,
    budget: number,
    variant: string,
    floorValue: number,
    status: JourneyLedgerStatus,
  ) {
    this.code = code;
    this.title = title;
    this.maximum = maximum;
    this.archived = archived;
    this.retries = retries;
    this.notes = notes;
    this.quantity = quantity;
    this.capacity = capacity;
    this.budget = budget;
    this.variant = variant;
    this.floorValue = floorValue;
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

  canMoveTo(next: JourneyLedgerStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "revoked";
      case "granted":
        return next === "expired";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: JourneyLedgerStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`journey ledger ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  projectedVolume(): number {
    return Math.round((this.capacity - this.budget) * 100) / 100;
  }

  copy(): JourneyLedger {
    return new JourneyLedger(
      this.code,
      this.title,
      this.maximum,
      this.archived,
      this.retries,
      this.notes,
      this.quantity,
      this.capacity,
      this.budget,
      this.variant,
      this.floorValue,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a journey ledger in status requested. */
export function newJourneyLedger(code: string, title: string): JourneyLedger {
  return new JourneyLedger(code, title, 0, false, 0, "", 0, 0, 0, "", 0, "requested");
}
