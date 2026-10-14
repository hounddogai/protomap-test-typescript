import * as text from "../../../../kit/text.js";

/** Where a sender ledger is in its life cycle. */
export type SenderLedgerStatus = "created" | "validated" | "published" | "retired";

/** A sender ledger. Its code is unique within a tenant. */
export class SenderLedger {
  code: string;
  label: string;
  summary: string;
  phone: string;
  minimum: number;
  cost: number;
  openRate: number;
  checksum: string;
  name: string;
  budget: number;
  status: SenderLedgerStatus;

  constructor(
    code: string,
    label: string,
    summary: string,
    phone: string,
    minimum: number,
    cost: number,
    openRate: number,
    checksum: string,
    name: string,
    budget: number,
    status: SenderLedgerStatus,
  ) {
    this.code = code;
    this.label = label;
    this.summary = summary;
    this.phone = phone;
    this.minimum = minimum;
    this.cost = cost;
    this.openRate = openRate;
    this.checksum = checksum;
    this.name = name;
    this.budget = budget;
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

  canMoveTo(next: SenderLedgerStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "published":
            return true;
        }
        return false;
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: SenderLedgerStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`sender ledger ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  netVolume(): number {
    return Math.round(this.cost * this.openRate * 100) / 100;
  }

  copy(): SenderLedger {
    return new SenderLedger(
      this.code,
      this.label,
      this.summary,
      this.phone,
      this.minimum,
      this.cost,
      this.openRate,
      this.checksum,
      this.name,
      this.budget,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a sender ledger in status created. */
export function newSenderLedger(code: string, label: string): SenderLedger {
  return new SenderLedger(code, label, "", "", 0, 0, 0, "", "", 0, "created");
}
